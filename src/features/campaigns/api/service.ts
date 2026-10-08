import { apiClient } from '@/lib/api-client';
import type {
  Campaign,
  CampaignFilters,
  CampaignMutationPayload,
  CampaignCall,
  CampaignUpdatePayload,
  CampaignsResponse,
  ProspectsResponse
} from './types';

// ============================================================
// Campaign Service — Data Access Layer (Read/Write Highway)
// ============================================================
// Pattern 2/3: the React frontend NEVER touches PocketBase — every call goes
// through the Clerk-gated route firewall (src/app/api/campaigns/*), which
// filters all PocketBase queries by the verified orgId.

function toQueryString(filters: CampaignFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getCampaigns(filters: CampaignFilters): Promise<CampaignsResponse> {
  return apiClient<CampaignsResponse>(`/campaigns${toQueryString(filters)}`);
}

export async function getCampaignById(id: string): Promise<Campaign> {
  return apiClient<Campaign>(`/campaigns/${id}`);
}

export async function createCampaign(data: CampaignMutationPayload): Promise<Campaign> {
  return apiClient<Campaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateCampaign(
  id: string,
  data: CampaignUpdatePayload
): Promise<Campaign> {
  return apiClient<Campaign>(`/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function getCampaignProspects(
  campaignId: string,
  filters: CampaignFilters = {}
): Promise<ProspectsResponse> {
  return apiClient<ProspectsResponse>(
    `/campaigns/${campaignId}/prospects${toQueryString(filters)}`
  );
}

export async function getCallById(callId: string): Promise<CampaignCall> {
  return apiClient<CampaignCall>(`/calls/${callId}`);
}