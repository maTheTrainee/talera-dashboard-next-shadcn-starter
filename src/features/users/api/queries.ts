import { queryOptions } from '@tanstack/react-query';
import type { LeadFilters } from './types';

// API-based query options using the secure API routes
export const leadKeys = {
  all: ['leads'] as const,
  list: (filters: LeadFilters) => [...leadKeys.all, 'list', filters] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const
};

export function leadsQueryOptions(filters: LeadFilters) {
  // Build query string for API
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.campaignType) params.set('campaignType', filters.campaignType);
  if (filters.sort) params.set('sort', filters.sort);

  return {
    queryKey: leadKeys.list(filters),
    queryFn: async () => {
      const response = await fetch(`/api/leads?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch leads');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  };
}

export function leadQueryOptions(id: string) {
  return {
    queryKey: leadKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/leads/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch lead');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5
  };
}
