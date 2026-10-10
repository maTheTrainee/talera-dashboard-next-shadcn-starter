'use client';

import * as React from 'react';
import { revalidateLogic, useStore } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { Icons } from '@/components/icons';
import { FieldDescription, FieldGroup } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { useAppForm } from '@/lib/form';
import { useFormStepper } from '@/hooks/use-stepper';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Separator } from '@/components/ui/separator';
import { CsvTemplateButton } from '@/components/csv-template-button';
import { createCampaign } from '../api/service';
import { tenantNumbersQueryOptions } from '../api/queries';
import type { CampaignMutationPayload } from '../api/types';
import { parseProspectCsv, type CsvRow } from '../utils/parse-csv';
import {
  campaignBaseSchema,
  campaignSchema,
  DIALING_WINDOW_START,
  DIALING_WINDOW_END,
  MIN_SCHEDULING_WINDOW_HOURS,
  normalizePhoneNumber
} from '../schemas/campaign';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { getQueryClient } from '@/lib/query-client';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SchedulingControls, toIsoDateTime, type SchedulingValue } from './scheduling-controls';

// Konfliktvalen (Granska & koppla) — items-mappning så att triggern visar
// den svenska etiketten istället för råa värden ("link"/"create"/"skip").
const CONFLICT_CHOICES: { value: 'link' | 'create' | 'skip'; label: string }[] = [
  { value: 'link', label: 'Koppla befintlig kontakt' },
  { value: 'create', label: 'Skapa ny ändå' },
  { value: 'skip', label: 'Hoppa över' }
];

// --- Step schemas (picked from the base object; the strict 4-hour scheduling
// window is validated immediately at step 2, and re-validated against the full
// schema at final submit) ---

const stepSchemas = [
  // Step 1: Grundinfo
  campaignBaseSchema.pick({ name: true, description: true }),
  // Step 2: Schemaläggning + agent + nummer — 4h är en REKOMMENDATION
  // (varningsdialog), inte ett hårt block. 08–19 + samma dag + ≤11h är hårda.
  campaignBaseSchema.pick({
    scheduled_start: true,
    scheduled_end: true,
    outbound_number: true,
    max_attempts: true
  }),
  // Step 3: CSV-uppladdning (obligatoriskt — dropzone + mall)
  z.object({
    csv_file: z.array(z.unknown()).min(1, 'Ladda upp en kontaktlista (CSV)')
  }),
  // Step 4: Granska & koppla
  z.object({})
];

// --- Review summary (reads form values) ---

function ReviewSummary({
  values
}: {
  values: {
    name: string;
    description: string;
    scheduled_start: string;
    scheduled_end: string;
    outbound_number?: string;
    max_attempts?: number;
    csv_file?: File[];
  };
}) {
  return (
    <div className='space-y-3'>
      <Separator />
      <div className='grid gap-3'>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Namn</p>
          <p className='text-sm'>{values.name || '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Beskrivning</p>
          <p className='text-sm'>{values.description || '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Schemaläggning</p>
          <p className='text-sm'>
            {values.scheduled_start
              ? `${new Date(values.scheduled_start).toLocaleString('sv-SE')} → ${new Date(values.scheduled_end).toLocaleString('sv-SE')}`
              : '—'}
          </p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Utgående nummer</p>
          <p className='text-sm'>
            {values.outbound_number && values.outbound_number !== 'default'
              ? normalizePhoneNumber(values.outbound_number)
              : 'Förvalt nummer'}
          </p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Max Kontaktförsök</p>
          <p className='text-sm'>
            {(values.max_attempts ?? 3) > 0 ? `${values.max_attempts ?? 3} försök` : 'Obegränsat'}
          </p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Prospekt-CSV</p>
          <p className='text-sm'>
            {values.csv_file?.length
              ? `${values.csv_file.length} fil(er) valda`
              : 'Ingen fil — importera senare'}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Wizard ---

type WizardFormValues = {
  name: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  outbound_number?: string;
  max_attempts?: number;
  csv_file?: File[];
};

export function CampaignWizard({ onDone }: { onDone: () => void }) {
  const router = useRouter();

  const {
    currentValidator,
    step,
    currentStep,
    isFirstStep,
    handleCancelOrBack,
    handleNextStepOrSubmit
  } = useFormStepper(stepSchemas, { fullSchema: campaignSchema });

  // Schemaläggning — datum + 24h-tider (Heldag 08:00–17:00 är standard,
  // datumet är idag). ISO byggs deterministiskt → valideringen feltolkar aldrig.
  const [scheduling, setScheduling] = React.useState<SchedulingValue>(() => ({
    date: new Date(new Date().setHours(0, 0, 0, 0)),
    start: '08:00',
    end: '17:00'
  }));

  // Kvälls-tillvalet (per-tenant, slås på av Talera i PB-admin).
  const { data: tenantData } = useQuery({
    queryKey: ['tenant'] as const,
    queryFn: () => apiClient<{ evenings: boolean }>('/tenant'),
    staleTime: 60_000
  });
  const evenings = tenantData?.evenings ?? false;

  // CSV-granskning: parsade rader + telefonbaserade konflikter + radval.
  const [csvRows, setCsvRows] = React.useState<CsvRow[]>([]);
  const [conflicts, setConflicts] = React.useState<Record<string, string>>({});
  const [choices, setChoices] = React.useState<Record<string, 'link' | 'create' | 'skip'>>({});
  const [warnOpen, setWarnOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const createMutation = useMutation({
    mutationFn: (data: CampaignMutationPayload) => createCampaign(data),
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Kunde inte skapa kampanjen. Försök igen.'
      )
  });

  interface ImportResult {
    created: number;
    linked: number;
    skipped: number;
    invalid: number;
  }

  const importMutation = useMutation({
    mutationFn: ({
      campaignId,
      rows,
      choices: rowChoices
    }: {
      campaignId: string;
      rows: CsvRow[];
      choices: Record<string, 'link' | 'create' | 'skip'>;
    }) =>
      apiClient<ImportResult>(`/campaigns/${campaignId}/prospects/import`, {
        method: 'POST',
        body: JSON.stringify({ rows, choices: rowChoices })
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ['campaigns'] as const });
    }
  });

  const contactsOnlyMutation = useMutation({
    mutationFn: (rows: CsvRow[]) =>
      apiClient<ImportResult>('/contacts/import', {
        method: 'POST',
        body: JSON.stringify({ rows })
      }),
    onSuccess: (result) => {
      getQueryClient().invalidateQueries({ queryKey: ['contacts'] as const });
      toast.success(
        `${result.created} kontakter sparade${result.skipped > 0 ? `, ${result.skipped} fanns redan` : ''}`
      );
      setConfirmOpen(false);
      onDone();
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Importen kunde inte göras. Försök igen.'
      )
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      description: '',
      scheduled_start: '',
      scheduled_end: '',
      outbound_number: 'default',
      max_attempts: 3,
      csv_file: []
    } as WizardFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: currentValidator as typeof campaignSchema,
      onDynamicAsyncDebounceMs: 500
    },
    onSubmit: async ({ value }) => {
      const campaign = await createMutation.mutateAsync({
        name: value.name,
        description: value.description,
        scheduled_start: value.scheduled_start,
        scheduled_end: value.scheduled_end,
        outbound_number:
          value.outbound_number === 'default' || !value.outbound_number
            ? null
            : normalizePhoneNumber(value.outbound_number),
        max_attempts: value.max_attempts ?? 3
      });

      // Importera prospekten enligt Granska & koppla-valen.
      const result = await importMutation.mutateAsync({
        campaignId: campaign.id,
        rows: csvRows,
        choices
      });

      toast.success(
        `Kampanjen skapad — ${result.created} nya, ${result.linked} kopplade${result.skipped > 0 ? `, ${result.skipped} hoppade över` : ''}`
      );
      onDone();
      router.push(`/dashboard/campaigns/${campaign.id}`);
    }
  });

  // Schemaläggningens tillstånd → formulärets ISO-värden.
  React.useEffect(() => {
    form.setFieldValue('scheduled_start', toIsoDateTime(scheduling.date, scheduling.start));
    form.setFieldValue('scheduled_end', toIsoDateTime(scheduling.date, scheduling.end));
  }, [scheduling, form]);

  const isDefault = useStore(form.store, (state) => state.isDefaultValue);
  const formValues = useStore(form.store, (state) => state.values) as WizardFormValues;

  // CSV-filen → parsade rader → telefonmatchning → förvalda radval.
  const csvFile = formValues.csv_file;
  React.useEffect(() => {
    const file = csvFile?.[0] as File | undefined;
    if (!file) {
      setCsvRows([]);
      setConflicts({});
      setChoices({});
      return;
    }
    let cancelled = false;
    void file.text().then(async (text) => {
      const rows = parseProspectCsv(text);
      if (cancelled) return;
      setCsvRows(rows);

      const phones = [...new Set(rows.map((r) => normalizePhoneNumber(r.phone)).filter(Boolean))];
      if (phones.length === 0) return;
      try {
        const result = await apiClient<{ matches: Record<string, string> }>(
          '/contacts/match-check',
          { method: 'POST', body: JSON.stringify({ phones }) }
        );
        if (cancelled) return;
        setConflicts(result.matches ?? {});
        const defaults: Record<string, 'link' | 'create' | 'skip'> = {};
        for (const row of rows) {
          const phone = normalizePhoneNumber(row.phone);
          if (!phone) continue;
          defaults[phone] = (result.matches ?? {})[phone] ? 'link' : 'create';
        }
        setChoices(defaults);
      } catch {
        if (!cancelled) setConflicts({});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [csvFile]);

  // Schemafönstrets längd i timmar (för varningen < 4h).
  const windowHours =
    (Number(scheduling.end.slice(0, 2)) * 60 +
      Number(scheduling.end.slice(3, 5)) -
      (Number(scheduling.start.slice(0, 2)) * 60 + Number(scheduling.start.slice(3, 5)))) /
    60;

  // Tenant numbers — the dropdown lists the org's numbers; with none in the
  // database the field locks to "Använd förvalt nummer" (greyed, n8n fallback).
  const { data: numbersData } = useQuery({
    ...tenantNumbersQueryOptions(),
    placeholderData: (prev) => prev
  });
  const hasNumbers = (numbersData?.items ?? []).length > 0;
  const numberOptions = [
    { value: 'default', label: 'Använd förvalt nummer' },
    ...(numbersData?.items ?? []).map((n) => ({
      value: n.number,
      label: n.label ? `${n.label} · ${n.number}` : n.number
    }))
  ];

  // Med egna nummer: första egna numret förvalt (förvalt finns kvar som val).
  React.useEffect(() => {
    const first = numbersData?.items?.[0]?.number;
    if (first && formValues.outbound_number === 'default') {
      form.setFieldValue('outbound_number', first);
    }
  }, [numbersData, formValues.outbound_number, form]);

  const handleNext = async () => {
    // < 4 timmar → varningsdialog (rekommendationen), inte ett hårt block.
    if (currentStep === 2 && scheduling.date && windowHours < MIN_SCHEDULING_WINDOW_HOURS) {
      setWarnOpen(true);
      return;
    }
    await handleNextStepOrSubmit(form);
  };

  const totalSteps = stepSchemas.length;

  return (
    /* Every submit (Enter key, the review step's submit button) routes
       through the stepper gate — calling form.handleSubmit directly on a
       non-final step would validate only that step's schema and submit. */
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleNext();
      }}
      noValidate
      className='flex w-full flex-col gap-2 p-0'
    >
      <div className='flex flex-col gap-2 pt-3'>
        <div className='flex flex-col items-center justify-start gap-1'>
          <span className='text-muted-foreground text-sm'>
            Steg {currentStep} av {totalSteps}
          </span>
          <Progress value={(currentStep / totalSteps) * 100} />
        </div>

        <AnimatePresence mode='popLayout'>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className='flex min-w-0 flex-col gap-2'
          >
            {currentStep === 1 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>Grundinfo</h3>
                <FieldDescription>Namnge kampanjen och beskriv dess syfte.</FieldDescription>

                <form.AppField
                  name='name'
                  children={(field) => (
                    <field.TextField label='Kampanjnamn' required placeholder='Q1 Försäljning' />
                  )}
                />

                <form.AppField
                  name='description'
                  children={(field) => (
                    <field.TextareaField
                      label='Beskrivning'
                      required
                      placeholder='Beskriv kampanjens syfte'
                      rows={3}
                    />
                  )}
                />
              </FieldGroup>
            )}

            {currentStep === 2 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>Schemaläggning</h3>
                <FieldDescription>
                  Ringfönster: {DIALING_WINDOW_START}–{DIALING_WINDOW_END} · Rekommendation min{' '}
                  {MIN_SCHEDULING_WINDOW_HOURS} h — kampanjen avslutas vid fönstrets slut och
                  kvarvarande prospekter kan återupptas.
                </FieldDescription>

                <SchedulingControls
                  value={scheduling}
                  onChange={setScheduling}
                  evenings={evenings}
                />

                <form.AppField
                  name='outbound_number'
                  children={(field) =>
                    hasNumbers ? (
                      <field.SelectField
                        label='Utgående nummer — ringer med detta'
                        options={numberOptions}
                        placeholder='Välj nummer'
                        description='Numret mottagaren ser när AI-agenten ringer.'
                      />
                    ) : (
                      <div className='bg-muted/40 rounded-lg border border-dashed p-3'>
                        <p className='text-sm font-medium'>Använd förvalt nummer</p>
                        <p className='text-muted-foreground text-xs'>
                          Talera ringer med ett förvalt nummer — kontakta oss för att få ett eget.
                        </p>
                      </div>
                    )
                  }
                />

                <form.AppField
                  name='max_attempts'
                  children={(field) => (
                    <field.TextField
                      label='Max Kontaktförsök'
                      type='number'
                      min={0}
                      placeholder='3 (0 = obegränsat)'
                    />
                  )}
                />
              </FieldGroup>
            )}

            {currentStep === 3 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>Prospekt-CSV</h3>
                <FieldDescription>
                  Ladda ner mallen, fyll i prospekten och släpp filen här. Steget är obligatoriskt —
                  prospekten importeras när kampanjen startar.
                </FieldDescription>

                <div className='flex justify-start'>
                  <CsvTemplateButton />
                </div>

                <form.AppField
                  name='csv_file'
                  children={(field) => (
                    <field.FileUploadField
                      label='Kontaktlista (CSV)'
                      description='Dra & släpp eller klicka för att ladda upp (max 5MB, .csv)'
                      accept={{ 'text/csv': ['.csv'] }}
                      maxSize={5000000}
                      maxFiles={1}
                    />
                  )}
                />
              </FieldGroup>
            )}

            {currentStep === 4 && (
              <div className='min-w-0 space-y-4'>
                <h3 className='text-lg font-semibold'>Granska & koppla</h3>
                <FieldDescription>
                  Kontrollera prospekterna — konflikter hanteras per rad innan kampanjen köas.
                </FieldDescription>
                <ReviewSummary values={formValues} />

                <div className='max-h-72 min-w-0 overflow-auto rounded-lg border'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted/60 sticky top-0 z-10'>
                      <tr className='text-muted-foreground text-left text-[11px] uppercase'>
                        <th className='py-2 pr-3 pl-3 font-medium'>Kontakt</th>
                        <th className='py-2 pr-3 font-medium'>Telefon</th>
                        <th className='py-2 pr-3 font-medium'>Hantering</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className='text-muted-foreground py-6 text-center'>
                            Ingen fil — gå tillbaka och ladda upp en CSV.
                          </td>
                        </tr>
                      ) : (
                        csvRows.map((row, index) => {
                          const phone = normalizePhoneNumber(row.phone);
                          const existingId = conflicts[phone];
                          const choice = choices[phone];
                          const name = `${row.first_name} ${row.last_name}`.trim();
                          return (
                            <tr
                              key={`${phone}-${index}`}
                              className='hover:bg-muted/40 border-b last:border-0'
                            >
                              <td className='py-2 pr-3 pl-3'>
                                <span className='font-medium'>{name || '—'}</span>
                                {row.company && (
                                  <span className='text-muted-foreground block text-xs'>
                                    {row.company}
                                  </span>
                                )}
                              </td>
                              <td className='text-muted-foreground py-2 pr-3 tabular-nums'>
                                {phone || '✕ ogiltigt nummer'}
                              </td>
                              <td className='py-2 pr-3'>
                                {!phone ? (
                                  <Badge
                                    variant='outline'
                                    className='bg-destructive/10 text-destructive'
                                  >
                                    Exkluderad
                                  </Badge>
                                ) : existingId ? (
                                  <Select
                                    items={CONFLICT_CHOICES}
                                    value={choice ?? 'link'}
                                    onValueChange={(v) =>
                                      setChoices((prev) => ({
                                        ...prev,
                                        [phone]: v as 'link' | 'create' | 'skip'
                                      }))
                                    }
                                  >
                                    <SelectTrigger className='h-7 w-[170px] text-xs'>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CONFLICT_CHOICES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                          {c.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant='secondary'>Ny — skapas & kopplas</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <p className='text-muted-foreground text-xs'>
                  {
                    csvRows.filter(
                      (r) =>
                        normalizePhoneNumber(r.phone) && !conflicts[normalizePhoneNumber(r.phone)]
                    ).length
                  }{' '}
                  nya ·{' '}
                  {
                    csvRows.filter(
                      (r) =>
                        normalizePhoneNumber(r.phone) && conflicts[normalizePhoneNumber(r.phone)]
                    ).length
                  }{' '}
                  befintliga · {csvRows.filter((r) => !normalizePhoneNumber(r.phone)).length}{' '}
                  ogiltiga
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className='flex w-full items-center justify-between gap-3 pt-3'>
          <Button
            size='sm'
            variant='ghost'
            type='button'
            disabled={isFirstStep}
            onClick={() => handleCancelOrBack({ onBack: () => {} })}
          >
            <Icons.chevronLeft /> Föregående
          </Button>
          <div className='flex w-full items-center justify-end gap-3 pt-3'>
            {!isDefault && (
              <Button
                type='button'
                onClick={() => form.reset()}
                className='rounded-lg'
                variant='outline'
                size='sm'
              >
                Återställ
              </Button>
            )}
            {currentStep === 4 && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={csvRows.length === 0 || importMutation.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                Spara endast kontakter
              </Button>
            )}
            {step.isCompleted ? (
              <LoadingButton loading={createMutation.isPending} type='submit'>
                Skapa kampanj & köa
              </LoadingButton>
            ) : (
              <Button size='sm' variant='ghost' type='button' onClick={() => void handleNext()}>
                Nästa <Icons.chevronRight />
              </Button>
            )}
          </div>
        </div>

        {/* Varning — < 4 timmar är en rekommendation, inte ett block */}
        <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Kort schemafönster</DialogTitle>
              <DialogDescription>
                Fönstret är {windowHours.toFixed(1).replace('.0', '')} timmar — det är inte
                garanterat att kampanjen hinner ringa alla nummer. Vår rekommendation är alltid
                minst {MIN_SCHEDULING_WINDOW_HOURS} timmar per kampanj.
              </DialogDescription>
            </DialogHeader>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setWarnOpen(false)}>
                Justera tiden
              </Button>
              <Button
                onClick={() => {
                  setWarnOpen(false);
                  void handleNextStepOrSubmit(form);
                }}
              >
                Fortsätt ändå
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bekräftelse — Spara endast kontakter skapar ingen kampanj */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Spara endast kontakter?</DialogTitle>
              <DialogDescription>
                Kampanjen skapas inte — kontakterna sparas bara i Kontakter. Är du säker?
              </DialogDescription>
            </DialogHeader>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setConfirmOpen(false)}>
                Avbryt
              </Button>
              <LoadingButton
                loading={contactsOnlyMutation.isPending}
                onClick={() => contactsOnlyMutation.mutate(csvRows)}
              >
                Ja, spara kontakterna
              </LoadingButton>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}

export function CampaignWizardTrigger() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Ny kampanj
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-2xl md:max-w-3xl lg:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Kampanjguiden</DialogTitle>
            <DialogDescription>Konfigurera den utgående kampanjen steg för steg.</DialogDescription>
          </DialogHeader>
          <CampaignWizard onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
