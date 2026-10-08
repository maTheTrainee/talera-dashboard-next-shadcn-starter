import { apiClient } from '@/lib/api-client';
import type {
  Contact,
  ContactFilters,
  ContactMutationPayload,
  ContactsResponse
} from './types';

// ============================================================
// Contacts Service — Data Access Layer (Read/Write Highway)
// ============================================================
// Pattern 2/3: the React frontend NEVER touches PocketBase — every call goes
// through the Clerk-gated route firewall (src/app/api/contacts/*), which
// filters all PocketBase queries by the verified orgId.

function toQueryString(filters: ContactFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getContacts(filters: ContactFilters): Promise<ContactsResponse> {
  return apiClient<ContactsResponse>(`/contacts${toQueryString(filters)}`);
}

export async function createContact(data: ContactMutationPayload): Promise<Contact> {
  return apiClient<Contact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateContact(
  id: string,
  data: Partial<ContactMutationPayload>
): Promise<Contact> {
  return apiClient<Contact>(`/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteContact(id: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' });
}
