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
import { createContactMutation, updateContactMutation } from '../api/mutations';
import type { Contact } from '../api/types';
import { toast } from 'sonner';
import {
  contactSchema,
  normalizeProspectPhone,
  type ContactFormValues
} from '../schemas/contact';
import { PROSPECT_STATUS_OPTIONS } from './contacts-table/options';

interface ContactFormSheetProps {
  contact?: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactFormSheet({ contact, open, onOpenChange }: ContactFormSheetProps) {
  const isEdit = !!contact;

  const createMutation = useMutation({
    ...createContactMutation,
    onSuccess: () => {
      toast.success('Kontakten skapad');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('Kunde inte skapa kontakten. Försök igen.')
  });

  const updateMutation = useMutation({
    ...updateContactMutation,
    onSuccess: () => {
      toast.success('Kontakten uppdaterad');
      onOpenChange(false);
    },
    onError: () => toast.error('Kunde inte uppdatera kontakten. Försök igen.')
  });

  const form = useAppForm({
    defaultValues: {
      first_name: contact?.first_name ?? '',
      last_name: contact?.last_name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      status: contact?.status ?? 'ny'
    } as ContactFormValues,
    validators: {
      onSubmit: contactSchema
    },
    onSubmit: async ({ value }) => {
      const values = { ...value, phone: normalizeProspectPhone(value.phone) };
      if (isEdit) {
        await updateMutation.mutateAsync({ id: contact.id, values });
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
          <SheetTitle>{isEdit ? 'Redigera kontakt' : 'Ny kontakt'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Uppdatera kontaktuppgifterna nedan.'
              : 'Fyll i uppgifterna för att skapa en ny prospekt.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            id='contact-form-sheet'
            className='space-y-4 p-4 md:p-4'
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <div className='grid grid-cols-2 gap-4'>
                <form.AppField
                  name='first_name'
                  children={(field) => (
                    <field.TextField label='Förnamn' required placeholder='Anna' />
                  )}
                />
                <form.AppField
                  name='last_name'
                  children={(field) => (
                    <field.TextField label='Efternamn' required placeholder='Andersson' />
                  )}
                />
              </div>

              <form.AppField
                name='email'
                children={(field) => (
                  <field.TextField
                    label='E-post'
                    type='email'
                    placeholder='anna@example.com'
                  />
                )}
              />

              <form.AppField
                name='phone'
                children={(field) => (
                  <field.TextField
                    label='Telefon'
                    required
                    type='tel'
                    placeholder='07X XXX XX XX'
                  />
                )}
              />

              <form.AppField
                name='status'
                children={(field) => (
                  <field.SelectField
                    label='Ringstatus'
                    required
                    options={PROSPECT_STATUS_OPTIONS}
                    placeholder='Välj status'
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
          <LoadingButton loading={isPending} type='submit' form='contact-form-sheet'>
            {isEdit ? 'Uppdatera kontakt' : 'Skapa kontakt'}
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ContactFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Ny kontakt
      </Button>
      <ContactFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
