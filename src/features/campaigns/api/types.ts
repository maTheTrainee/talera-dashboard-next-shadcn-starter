export type CampaignStatus = 'köad' | 'live' | 'pausad' | 'avslutad';

export type ProspectStatus =
  | 'ny'
  | 'i_ko'
  | 'ringer'
  | 'i_samtal'
  | 'avslutat'
  | 'ej_svar'
  | 'uppföljning'
  | 'max_försök';

export interface Campaign {
  id: string;
  org_id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  /** ISO — strict 4-hour minimum scheduling window is enforced by Zod. */
  scheduled_start: string;
  scheduled_end: string;
  uv_agent_id: string;
  /** E.164 — regex-cleaned on input (07X → +467X). */
  outbound_number: string;
  /** Anti-spam cap: the engine stops dialing at this many attempts without a booked follow-up. 0 = unlimited. */
  max_attempts: number | null;
  created: string;
  updated: string;
}

export interface CampaignProspect {
  id: string;
  org_id: string;
  campaign_id: string;
  /** Engine call id (uv) written back by n8n after each completed call. */
  call_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: ProspectStatus;
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

export interface CampaignCall {
  id: string;
  org_id: string;
  campaign_id: string;
  prospect_id: string | null;
  /** Engine session id (uv). */
  call_id: string;
  status: string;
  outcome: string | null;
  summary: string | null;
  duration_seconds: number;
  transcript: { text: string; speaker: 'user' | 'agent'; isFinal: boolean }[];
  created: string;
}

export type CampaignFilters = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
};

export interface CampaignsResponse {
  items: Campaign[];
  total_items: number;
}

export interface ProspectsResponse {
  items: CampaignProspect[];
  total_items: number;
}

export type CampaignMutationPayload = {
  name: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  uv_agent_id: string;
  outbound_number: string;
  /** Anti-spam cap: 0 = unlimited (default 3). */
  max_attempts?: number | null;
};

export type CampaignUpdatePayload = Partial<CampaignMutationPayload> & {
  status?: CampaignStatus;
};