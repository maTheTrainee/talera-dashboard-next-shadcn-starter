export interface Contact {
  id: string;
  /** Clerk-organisationens id — tenant-nyckeln, server-stampad. */
  clerk_org_id: string;
  /** Clerk-användarens id — vem som skapade kontakten (audit). */
  created_by: string | null;
  /** Kampanjrelationen (PB-fältnamnet `campaign`) — en kontakt ligger i max en kampanj. */
  campaign: string | null;
  /** Kampanjens namn — expanderas server-side av /api/contacts (relation). */
  campaign_name?: string | null;
  /** Engine call id (uv) written back by n8n after each completed call. */
  call_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  /** Företagsnamn — helps operators recall the company behind the contact. */
  company: string | null;
  /**
   * Organisationsnummer — the LEAD's Swedish company number. Business data
   * about the prospect — never a tenant key (that is `clerk_org_id`).
   */
  org_number: string | null;
  status: string;
  call_outcome: string | null;
  /** Senaste samtalets n8n-sammanfattning (n8n skriver efter varje samtal). */
  call_summary: string | null;
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
  status?: string | string[];
  campaign?: string | string[];
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
  org_number?: string | null;
  email: string;
  phone: string;
  status: string;
  follow_up_at?: string | null;
};
