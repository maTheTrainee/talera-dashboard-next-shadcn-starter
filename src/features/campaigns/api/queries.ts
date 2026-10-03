import { queryOptions } from '@tanstack/react-query';
import type { CampaignFilters } from './types';

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (filters: CampaignFilters) => [...campaignKeys.all, 'list', filters] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const
};

export function campaignsQueryOptions(filters: CampaignFilters) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);

  return {
    queryKey: campaignKeys.list(filters),
    queryFn: async () => {
      const response = await fetch(`/api/campaigns?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch campaigns');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  };
}

export function campaignQueryOptions(id: string) {
  return {
    queryKey: campaignKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch campaign');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5
  };
}
