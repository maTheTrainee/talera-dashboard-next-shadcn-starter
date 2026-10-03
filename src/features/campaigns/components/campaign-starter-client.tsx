'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppForm } from '@/lib/form';
import { zodValidator } from '@tanstack/zod-adapter';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import { campaignSchema, quickDialSchema } from '../schemas/campaign';
import { createCampaign, quickDial, parseCSV, generateCSVTemplate } from '../api/service';
import { useOrganization } from '@clerk/nextjs';

export function CampaignStarter() {
  const { t } = useI18n();
  const { organization } = useOrganization();
  const orgId = organization?.id;

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<{ name: string; phone: string }> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickDialSubmitting, setIsQuickDialSubmitting] = useState(false);

  // Bulk Import Form - using useAppForm with field components
  const bulkForm = useAppForm({
    defaultValues: {
      name: '',
      type: 'outbound' as 'outbound' | 'inbound',
      phoneNumbers: [] as Array<{ name: string; phone: string }>
    },
    validators: {
      onSubmit: zodValidator(campaignSchema)
    },
    onSubmit: async ({ value }) => {
      if (!orgId) {
        toast.error('Ingen aktiv organisation');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await createCampaign({ ...value, organizationId: orgId });
        if (result.success) {
          toast.success(t('campaign.success'));
          bulkForm.reset();
          setCsvFile(null);
          setCsvPreview(null);
        } else {
          toast.error(t('campaign.error'));
        }
      } catch {
        toast.error(t('campaign.error'));
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Quick Dial Form
  const quickDialForm = useAppForm({
    defaultValues: {
      name: '',
      phone: '',
      campaignType: 'outbound' as 'outbound' | 'inbound',
      organizationId: orgId || ''
    },
    validators: {
      onSubmit: zodValidator(quickDialSchema)
    },
    onSubmit: async ({ value }) => {
      if (!orgId) {
        toast.error('Ingen aktiv organisation');
        return;
      }
      setIsQuickDialSubmitting(true);
      try {
        const result = await quickDial({ ...value, organizationId: orgId });
        if (result.success) {
          toast.success(result.message);
          quickDialForm.reset();
        } else {
          toast.error(t('campaign.error'));
        }
      } catch {
        toast.error(t('campaign.error'));
      } finally {
        setIsQuickDialSubmitting(false);
      }
    }
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        setCsvFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = parseCSV(e.target?.result as string);
            setCsvPreview(parsed);
            bulkForm.setFieldValue('phoneNumbers', parsed);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Fel vid uppläsning av CSV');
          }
        };
        reader.readAsText(file);
      } else {
        toast.error('Endast CSV-filer accepteras');
      }
    },
    [bulkForm]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] }
  });

  const handleTemplateDownload = () => {
    const blob = new Blob([generateCSVTemplate()], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kampanj-mall.csv';
    link.click();
  };

  const bulkPhoneNumbers = bulkForm.state.values.phoneNumbers;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('campaign.title')}</h1>
          <p className='text-muted-foreground'>{t('campaign.bulk-import')}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Bulk Import Section */}
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.upload className='h-5 w-5' />
              {t('campaign.bulk-import')}
            </CardTitle>
            <CardDescription>{t('campaign.csv-upload')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                bulkForm.handleSubmit();
              }}
              className='space-y-4'
            >
              <div className='space-y-2'>
                <Label htmlFor='campaign-name'>{t('campaign.campaign-name')}</Label>
                <bulkForm.AppField name='name'>
                  {(field) => (
                    <field.TextField
                      label={t('campaign.campaign-name')}
                      id='campaign-name'
                      placeholder='T.ex. Q4 Avtalssättning'
                      {...{
                        value: field.state.value ?? '',
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          field.handleChange(e.target.value),
                        onBlur: field.handleBlur,
                        name: field.name
                      }}
                    />
                  )}
                </bulkForm.AppField>
              </div>
              <div className='space-y-2'>
                <Label>{t('campaign.campaign-type')}</Label>
                <bulkForm.AppField name='type'>
                  {(field) => (
                    <field.SelectField
                      label={t('campaign.campaign-type')}
                      placeholder={t('campaign.select-type')}
                      options={[
                        { value: 'outbound', label: t('campaign.outbound') },
                        { value: 'inbound', label: t('campaign.inbound') }
                      ]}
                      {...{
                        value: field.state.value ?? '',
                        onChange: (v: string) => field.handleChange(v as 'outbound' | 'inbound'),
                        name: field.name
                      }}
                    />
                  )}
                </bulkForm.AppField>
              </div>

              <Separator className='my-4' />

              <div className='space-y-2'>
                <Label className='flex items-center justify-between'>
                  <span>{t('campaign.csv-upload')}</span>
                  <Button type='button' variant='ghost' size='sm' onClick={handleTemplateDownload}>
                    <Icons.download className='mr-1 h-3.5 w-3.5' />
                    {t('campaign.download-template')}
                  </Button>
                </Label>
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Icons.upload className='mx-auto h-10 w-10 text-muted-foreground mb-3' />
                  <p className='text-sm text-muted-foreground'>{t('campaign.drag-drop')}</p>
                  {csvFile && (
                    <div className='mt-3 text-sm text-green-600 dark:text-green-400'>
                      {csvFile.name} ({csvPreview?.length ?? 0} poster)
                    </div>
                  )}
                </div>
              </div>

              {csvPreview && csvPreview.length > 0 && (
                <div className='space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3'>
                  <p className='font-medium text-sm'>
                    {t('common.success')}: {csvPreview.length} nummer laddade
                  </p>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-left text-muted-foreground'>
                        <th className='pb-2'>{t('leads.name')}</th>
                        <th className='pb-2'>{t('leads.phone')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 10).map((row, i) => (
                        <tr key={i} className='border-t'>
                          <td className='py-1 truncate max-w-[150px]'>{row.name}</td>
                          <td className='py-1 font-mono'>{row.phone}</td>
                        </tr>
                      ))}
                      {csvPreview.length > 10 && (
                        <tr>
                          <td
                            colSpan={2}
                            className='py-2 text-center text-muted-foreground text-sm'
                          >
                            ...och {csvPreview.length - 10} fler
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <LoadingButton
                type='submit'
                className='w-full'
                loading={isSubmitting}
                disabled={!csvPreview || csvPreview.length === 0}
              >
                <Icons.send className='mr-2 h-4 w-4' />
                {t('campaign.launch-campaign')}
              </LoadingButton>
            </form>
          </CardContent>
        </Card>

        {/* Quick Dial Section */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.zap className='h-5 w-5 text-yellow-500' />
              {t('campaign.quick-test')}
            </CardTitle>
            <CardDescription>Testa ett enstaka samtal direkt</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                quickDialForm.handleSubmit();
              }}
              className='space-y-4'
            >
              <div className='space-y-2'>
                <Label htmlFor='quick-name'>{t('campaign.contact-name')}</Label>
                <quickDialForm.AppField name='name'>
                  {(field) => (
                    <field.TextField
                      label={t('campaign.contact-name')}
                      id='quick-name'
                      placeholder='T.ex. Erik Andersson'
                      {...{
                        value: field.state.value ?? '',
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          field.handleChange(e.target.value),
                        onBlur: field.handleBlur,
                        name: field.name
                      }}
                    />
                  )}
                </quickDialForm.AppField>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='quick-phone'>{t('campaign.phone-number')}</Label>
                <quickDialForm.AppField name='phone'>
                  {(field) => (
                    <field.TextField
                      label={t('campaign.phone-number')}
                      id='quick-phone'
                      placeholder='+46 70 123 45 67'
                      {...{
                        value: field.state.value ?? '',
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          field.handleChange(e.target.value),
                        onBlur: field.handleBlur,
                        name: field.name
                      }}
                    />
                  )}
                </quickDialForm.AppField>
              </div>
              <div className='space-y-2'>
                <Label>{t('campaign.campaign-type')}</Label>
                <quickDialForm.AppField name='campaignType'>
                  {(field) => (
                    <field.SelectField
                      label={t('campaign.campaign-type')}
                      placeholder={t('campaign.select-type')}
                      options={[
                        { value: 'outbound', label: t('campaign.outbound') },
                        { value: 'inbound', label: t('campaign.inbound') }
                      ]}
                      {...{
                        value: field.state.value ?? '',
                        onChange: (v: string) => field.handleChange(v as 'outbound' | 'inbound'),
                        name: field.name
                      }}
                    />
                  )}
                </quickDialForm.AppField>
              </div>

              <LoadingButton type='submit' className='w-full' loading={isQuickDialSubmitting}>
                <Icons.phoneOutgoing className='mr-2 h-4 w-4' />
                {t('campaign.start-test-call')}
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
