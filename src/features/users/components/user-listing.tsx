import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { leadsQueryOptions } from '../api/queries';
import { LeadsTable } from './leads-table';
import type { LeadFilters, LeadStatus } from '../api/types';

export default function LeadsListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const campaignType = searchParamsCache.get('campaignType');
  const sort = searchParamsCache.get('sort');

  const filters: LeadFilters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status: status as LeadStatus }),
    ...(campaignType && { campaignType: campaignType as 'outbound' | 'inbound' }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(leadsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LeadsTable />
    </HydrationBoundary>
  );
}
