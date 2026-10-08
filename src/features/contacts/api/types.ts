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
  /** Företagsnamn — helps operators recall the company behind the contact. */
  company: string | null;
  status: string;
  call_outcome: string | null;
  /** "Uppföljning 2026-05-03 15:30" — when the agent will call back. */
  follow_up_at: string | null;
  /** Every dial attempt (n8n-maintained, read-only from the app). */
  contact_attempts: number | null;
  last_contacted_at: string | null;
  last_conversation_at: string | null;
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
  company?: string | null;
  email: string;
  phone: string;
  status: string;
  follow_up_at?: string | null;
};
