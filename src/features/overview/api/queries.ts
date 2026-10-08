import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { UsageResponse } from './types';

export const usageKeys = {
  all: ['usage'] as const,
  current: () => [...usageKeys.all, 'current'] as const
};

export const usageQueryOptions = () =>
  queryOptions({
    queryKey: usageKeys.current(),
    queryFn: () => apiClient<UsageResponse>('/usage'),
    staleTime: 30_000
  });