import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  getCampaigns,
  getCampaignById,
  getCampaignProspects,
  getCallById
} from './service';
import type {
  CampaignFilters,
  TenantNumbersResponse
} from './types';

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (filters: CampaignFilters) => [...campaignKeys.all, 'list', filters] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
  prospects: (campaignId: string, filters: CampaignFilters = {}) =>
    [...campaignKeys.all, 'prospects', campaignId, filters] as const,
  call: (callId: string) => [...campaignKeys.all, 'call', callId] as const
};

export const campaignsQueryOptions = (filters: CampaignFilters) =>
  queryOptions({
    queryKey: campaignKeys.list(filters),
    queryFn: () => getCampaigns(filters),
    staleTime: 60_000
  });

export const campaignDetailOptions = (id: string) =>
  queryOptions({
    queryKey: campaignKeys.detail(id),
    queryFn: () => getCampaignById(id),
    staleTime: 60_000
  });

export const campaignProspectsOptions = (campaignId: string, filters: CampaignFilters = {}) =>
  queryOptions({
    queryKey: campaignKeys.prospects(campaignId, filters),
    queryFn: () => getCampaignProspects(campaignId, filters),
    staleTime: 30_000
  });

export const campaignCallOptions = (callId: string) =>
  queryOptions({
    queryKey: campaignKeys.call(callId),
    queryFn: () => getCallById(callId)
  });

export const tenantNumbersQueryOptions = () =>
  queryOptions({
    queryKey: ['numbers', 'tenant'] as const,
    queryFn: () => apiClient<TenantNumbersResponse>('/numbers'),
    staleTime: 300_000
  });