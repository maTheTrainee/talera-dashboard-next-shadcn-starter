import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createContact, updateContact, deleteContact } from './service';
import { contactKeys } from './queries';
import type { ContactMutationPayload } from './types';

export const createContactMutation = mutationOptions({
  mutationFn: (data: ContactMutationPayload) => createContact(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: contactKeys.all });
  }
});

export const updateContactMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: Partial<ContactMutationPayload> }) =>
    updateContact(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: contactKeys.all });
  }
});

export const deleteContactMutation = mutationOptions({
  mutationFn: (id: string) => deleteContact(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: contactKeys.all });
  }
});
