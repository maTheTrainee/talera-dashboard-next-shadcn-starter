'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { campaignsQueryOptions } from '@/features/campaigns/api/queries';
import { campaignColumns } from './campaigns-columns';
import type { CampaignFilters } from '@/features/campaigns/api/types';
import { cn } from '@/lib/utils';

export function CampaignsTable() {
  const columnIds = campaignColumns()
    .map((c) => c.id)
    .filter(Boolean) as string[];

  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    status: parseAsString,
    type: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters: CampaignFilters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.status && { status: params.status as CampaignFilters['status'] }),
    ...(params.type && { type: params.type as 'outbound' | 'inbound' }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(campaignsQueryOptions(filters));

  const pageCount = Math.ceil(data.total_campaigns / params.perPage);

  const { table } = useDataTable({
    data: data.campaigns,
    columns: campaignColumns(),
    pageCount,
    shallow: true,
    debounceMs: 500
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
