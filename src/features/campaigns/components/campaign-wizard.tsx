'use client';

import * as React from 'react';
import { revalidateLogic, useStore } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
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
import { createCampaignMutation } from '../api/mutations';
import {
  campaignBaseSchema,
  campaignSchema,
  MIN_SCHEDULING_WINDOW_HOURS,
  normalizePhoneNumber
} from '../schemas/campaign';

// --- Step schemas (picked from the base object; the strict 4-hour scheduling
// window is validated immediately at step 2, and re-validated against the full
// schema at final submit) ---

const stepSchemas = [
  // Step 1: Grundinfo
  campaignBaseSchema.pick({ name: true, description: true }),
  // Step 2: Schemaläggning + agent + nummer
  campaignBaseSchema
    .pick({
      scheduled_start: true,
      scheduled_end: true,
      uv_agent_id: true,
      outbound_number: true
    })
    .refine(
      (data) => {
        const start = new Date(data.scheduled_start).getTime();
        const end = new Date(data.scheduled_end).getTime();
        if (Number.isNaN(start) || Number.isNaN(end)) return false;
        return end - start >= MIN_SCHEDULING_WINDOW_HOURS * 60 * 60 * 1000;
      },
      {
        message: `Schemaläggningsfönstret måste vara minst ${MIN_SCHEDULING_WINDOW_HOURS} timmar`,
        path: ['scheduled_end']
      }
    ),
  // Step 3: CSV-uppladdning (valfritt — dropzone + mall)
  z.object({}),
  // Step 4: Granska
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
    uv_agent_id: string;
    outbound_number: string;
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
          <p className='text-muted-foreground text-xs font-medium uppercase'>Agent / Nummer</p>
          <p className='text-sm'>
            {values.uv_agent_id || '—'} ·{' '}
            {values.outbound_number ? normalizePhoneNumber(values.outbound_number) : '—'}
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
  uv_agent_id: string;
  outbound_number: string;
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

  const createMutation = useMutation({
    ...createCampaignMutation,
    onSuccess: (campaign) => {
      toast.success('Kampanjen skapad — öppnar cockpiten');
      onDone();
      router.push(`/dashboard/campaigns/${campaign.id}`);
    },
    onError: () => toast.error('Kunde inte skapa kampanjen. Försök igen.')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      description: '',
      scheduled_start: '',
      scheduled_end: '',
      uv_agent_id: '',
      outbound_number: '',
      csv_file: []
    } as WizardFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: currentValidator as typeof campaignSchema,
      onDynamicAsyncDebounceMs: 500
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        name: value.name,
        description: value.description,
        scheduled_start: value.scheduled_start,
        scheduled_end: value.scheduled_end,
        uv_agent_id: value.uv_agent_id,
        outbound_number: normalizePhoneNumber(value.outbound_number)
      });
    }
  });

  const isDefault = useStore(form.store, (state) => state.isDefaultValue);
  const formValues = useStore(form.store, (state) => state.values) as WizardFormValues;

  const handleNext = async () => {
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
            className='flex flex-col gap-2'
          >
            {currentStep === 1 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>Grundinfo</h3>
                <FieldDescription>Namnge kampanjen och beskriv dess syfte.</FieldDescription>

                <form.AppField
                  name='name'
                  children={(field) => (
                    <field.TextField
                      label='Kampanjnamn'
                      required
                      placeholder='Q1 Försäljning'
                    />
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
                  Kampanjen måste spänna minst {MIN_SCHEDULING_WINDOW_HOURS} timmar. Nummer
                  normaliseras automatiskt (07X ➔ +467X).
                </FieldDescription>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <form.AppField
                    name='scheduled_start'
                    children={(field) => (
                      <field.TextField label='Start' required type='datetime-local' />
                    )}
                  />
                  <form.AppField
                    name='scheduled_end'
                    children={(field) => (
                      <field.TextField label='Slut' required type='datetime-local' />
                    )}
                  />
                </div>

                <form.AppField
                  name='uv_agent_id'
                  children={(field) => (
                    <field.TextField label='Röstagent-ID' required placeholder='agent_xxx' />
                  )}
                />

                <form.AppField
                  name='outbound_number'
                  children={(field) => (
                    <field.TextField
                      label='Utgående nummer'
                      required
                      type='tel'
                      placeholder='07X XXX XX XX'
                    />
                  )}
                />
              </FieldGroup>
            )}

            {currentStep === 3 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>Prospekt-CSV</h3>
                <FieldDescription>
                  Ladda ner mallen, fyll i prospekten och släpp filen här. Steget är valfritt —
                  prospekt kan importeras senare.
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
                      maxSize={5000000}
                      maxFiles={1}
                    />
                  )}
                />
              </FieldGroup>
            )}

            {currentStep === 4 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Granska & skapa</h3>
                <FieldDescription>Kontrollera uppgifterna innan kampanjen köas.</FieldDescription>
                <ReviewSummary values={formValues} />
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
            {step.isCompleted ? (
              <LoadingButton loading={createMutation.isPending} type='submit'>
                Skapa kampanj
              </LoadingButton>
            ) : (
              <Button size='sm' variant='ghost' type='button' onClick={() => void handleNext()}>
                Nästa <Icons.chevronRight />
              </Button>
            )}
          </div>
        </div>
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
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Kampanjguiden</DialogTitle>
            <DialogDescription>
              Konfigurera den utgående kampanjen steg för steg.
            </DialogDescription>
          </DialogHeader>
          <CampaignWizard onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
