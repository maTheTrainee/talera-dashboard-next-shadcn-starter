'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import * as React from 'react';
import { getSortingStateParser } from '@/lib/parsers';
import { contactsQueryOptions } from '../../api/queries';
import { campaignsQueryOptions } from '@/features/campaigns/api/queries';
import { getColumns, type CampaignFilterOption } from './columns';
import { LinkCampaignDialog } from '../link-campaign-dialog';

export function ContactsTable() {
  // Kampanjoptions — the tenant's campaigns drive the Kampanj column + filter.
  // Empty (inbound-only tenants) = the column is dropped entirely.
  const { data: campaignsData } = useQuery(campaignsQueryOptions({ limit: 50 }));
  const campaignOptions = React.useMemo<CampaignFilterOption[]>(
    () =>
      (campaignsData?.items ?? [])
        .map((c) => ({ value: c.id, label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label, 'sv')),
    [campaignsData]
  );

  const columns = React.useMemo(() => getColumns(campaignOptions), [campaignOptions]);
  const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    status: parseAsArrayOf(parseAsString),
    campaign: parseAsArrayOf(parseAsString),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.status?.length && { status: params.status }),
    ...(params.campaign?.length && { campaign: params.campaign }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(contactsQueryOptions(filters));

  const pageCount = Math.ceil(data.total_items / params.perPage);

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    // En kontakt ligger i max en kampanj — rader med kampanj går inte att
    // markera ("Lägg i kampanj" riktar sig endast till fria kontakter).
    enableRowSelection: (row) => !row.original.campaign,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  const [linkOpen, setLinkOpen] = React.useState(false);
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
      {selectedRows.length > 0 && (
        <div className='flex items-center gap-2'>
          <Button size='sm' onClick={() => setLinkOpen(true)}>
            Lägg i kampanj ({selectedRows.length})
          </Button>
          <span className='text-muted-foreground text-xs'>
            {selectedRows.length}{' '}
            {selectedRows.length === 1 ? 'kontakt markerad' : 'kontakter markerade'}
          </span>
        </div>
      )}
      <LinkCampaignDialog
        open={linkOpen}
        contacts={selectedRows.map((row) => row.original)}
        onClose={() => {
          setLinkOpen(false);
          table.resetRowSelection();
        }}
      />
    </DataTable>
  );
}

export function ContactsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
