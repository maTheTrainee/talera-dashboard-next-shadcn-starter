import { queryOptions } from '@tanstack/react-query';
import { getContacts } from './service';
import type { Contact, ContactFilters } from './types';

export type { Contact };

export const contactKeys = {
  all: ['contacts'] as const,
  list: (filters: ContactFilters) => [...contactKeys.all, 'list', filters] as const,
  detail: (id: string) => [...contactKeys.all, 'detail', id] as const
};

export const contactsQueryOptions = (filters: ContactFilters) =>
  queryOptions({
    queryKey: contactKeys.list(filters),
    queryFn: () => getContacts(filters),
    staleTime: 60_000
  });
