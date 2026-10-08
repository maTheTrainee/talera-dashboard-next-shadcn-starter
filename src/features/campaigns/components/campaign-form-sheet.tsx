'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createCampaignMutation, updateCampaignMutation } from '../api/mutations';
import type { Campaign } from '../api/types';
import { toast } from 'sonner';
import {
  campaignSchema,
  normalizePhoneNumber,
  type CampaignFormValues
} from '../schemas/campaign';

interface CampaignFormSheetProps {
  campaign?: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignFormSheet({ campaign, open, onOpenChange }: CampaignFormSheetProps) {
  const isEdit = !!campaign;

  const createMutation = useMutation({
    ...createCampaignMutation,
    onSuccess: () => {
      toast.success('Kampanjen skapad');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('Kunde inte skapa kampanjen. Försök igen.')
  });

  const updateMutation = useMutation({
    ...updateCampaignMutation,
    onSuccess: () => {
      toast.success('Kampanjen uppdaterad');
      onOpenChange(false);
    },
    onError: () => toast.error('Kunde inte uppdatera kampanjen. Försök igen.')
  });

  const form = useAppForm({
    defaultValues: {
      name: campaign?.name ?? '',
      description: campaign?.description ?? '',
      scheduled_start: campaign?.scheduled_start?.slice(0, 16) ?? '',
      scheduled_end: campaign?.scheduled_end?.slice(0, 16) ?? '',
      uv_agent_id: campaign?.uv_agent_id ?? '',
      outbound_number: campaign?.outbound_number ?? ''
    } as CampaignFormValues,
    validators: {
      onSubmit: campaignSchema
    },
    onSubmit: async ({ value }) => {
      const values = {
        ...value,
        outbound_number: normalizePhoneNumber(value.outbound_number)
      };
      if (isEdit) {
        await updateMutation.mutateAsync({ id: campaign.id, values });
      } else {
        await createMutation.mutateAsync(values);
      }
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Redigera kampanj' : 'Ny kampanj'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Uppdatera kampanjinställningarna nedan.'
              : 'Konfigurera den utgående kampanjen (minst 4 timmars fönster).'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            id='campaign-form-sheet'
            className='space-y-4 p-4 md:p-4'
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
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

              <div className='grid grid-cols-2 gap-4'>
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
                    placeholder='07X XXX XX XX (normaliseras till +467X)'
                  />
                )}
              />
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <LoadingButton loading={isPending} type='submit' form='campaign-form-sheet'>
            {isEdit ? 'Uppdatera kampanj' : 'Skapa kampanj'}
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function CampaignFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Ny kampanj
      </Button>
      <CampaignFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}