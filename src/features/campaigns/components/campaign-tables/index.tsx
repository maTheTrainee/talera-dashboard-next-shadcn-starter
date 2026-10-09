'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates
} from 'nuqs';
import * as React from 'react';
import { getSortingStateParser } from '@/lib/parsers';
import { campaignsQueryOptions } from '../../api/queries';
import type { Campaign } from '../../api/types';
import { CampaignProspectsDialog } from '../campaign-prospects-dialog';
import { getColumns } from './columns';

export function CampaignsTable() {
  // Kampanjprospekt-popup — clicking the campaign name (or the prospekt
  // count) opens the campaign's prospects in a Kontaktlistor-style dialog.
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(
    null
  );

  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    status: parseAsArrayOf(parseAsString),
    sort: getSortingStateParser(['name', 'prospect_count', 'scheduled_start', 'scheduled_end']).withDefault(
      []
    )
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.status?.length && { status: params.status }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(campaignsQueryOptions(filters));

  const pageCount = Math.ceil(data.total_items / params.perPage);

  const columns = React.useMemo(() => getColumns(setSelectedCampaign), []);

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
      <CampaignProspectsDialog
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />
    </>
  );
}

export function CampaignsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
