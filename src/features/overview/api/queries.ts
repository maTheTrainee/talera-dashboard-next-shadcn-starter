import { queryOptions } from '@tanstack/react-query';
import type { OverviewFilters } from './types';
import {
  getOverviewStats,
  getOutboundChartData,
  getInboundChartData,
  getOutboundPieData,
  getInboundPieData
} from './service';

export const overviewKeys = {
  all: ['overview'] as const,
  stats: (filters: OverviewFilters) => [...overviewKeys.all, 'stats', filters] as const,
  events: (filters: OverviewFilters) => [...overviewKeys.all, 'events', filters] as const,
  outboundChart: () => [...overviewKeys.all, 'chart', 'outbound'] as const,
  inboundChart: () => [...overviewKeys.all, 'chart', 'inbound'] as const,
  outboundPie: () => [...overviewKeys.all, 'pie', 'outbound'] as const,
  inboundPie: () => [...overviewKeys.all, 'pie', 'inbound'] as const
};

export function overviewStatsQueryOptions(filters: OverviewFilters) {
  return queryOptions({
    queryKey: overviewKeys.stats(filters),
    queryFn: () => getOverviewStats(filters),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}

export function outboundChartQueryOptions() {
  return queryOptions({
    queryKey: overviewKeys.outboundChart(),
    queryFn: () => getOutboundChartData(),
    staleTime: 1000 * 60 * 10 // 10 minutes
  });
}

export function inboundChartQueryOptions() {
  return queryOptions({
    queryKey: overviewKeys.inboundChart(),
    queryFn: () => getInboundChartData(),
    staleTime: 1000 * 60 * 10 // 10 minutes
  });
}

export function outboundPieQueryOptions() {
  return queryOptions({
    queryKey: overviewKeys.outboundPie(),
    queryFn: () => getOutboundPieData(),
    staleTime: 1000 * 60 * 10 // 10 minutes
  });
}

export function inboundPieQueryOptions() {
  return queryOptions({
    queryKey: overviewKeys.inboundPie(),
    queryFn: () => getInboundPieData(),
    staleTime: 1000 * 60 * 10 // 10 minutes
  });
}
