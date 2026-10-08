export interface Contact {
  id: string;
  org_id: string;
  campaign_id: string | null;
  /** Engine call id (uv) written back by n8n after each completed call. */
  call_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  call_outcome: string | null;
  created: string;
  updated: string;
}

export type ContactFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
};

export interface ContactsResponse {
  items: Contact[];
  total_items: number;
}

export type ContactMutationPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
};
