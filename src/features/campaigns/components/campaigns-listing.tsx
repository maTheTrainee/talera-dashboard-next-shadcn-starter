import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { campaignsQueryOptions } from '../api/queries';
import { CampaignsTable } from './campaigns-table';
import type { CampaignFilters } from '../api/types';

export default function CampaignsListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const type = searchParamsCache.get('type');
  const sort = searchParamsCache.get('sort');

  const filters: CampaignFilters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status: status as CampaignFilters['status'] }),
    ...(type && { type: type as 'outbound' | 'inbound' }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(campaignsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CampaignsTable />
    </HydrationBoundary>
  );
}
