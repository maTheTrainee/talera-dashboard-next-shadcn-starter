'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { leadsQueryOptions } from '../../api/queries';
import { leadColumns } from './columns';
import type { LeadFilters, LeadStatus } from '../../api/types';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export function LeadsTable() {
  const columnIds = leadColumns()
    .map((c) => c.id)
    .filter(Boolean) as string[];

  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    status: parseAsString,
    campaignType: parseAsString,
    campaignId: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([]),
    dateFrom: parseAsString,
    dateTo: parseAsString,
    followUpStatus: parseAsString,
    hasFollowUp: parseAsString
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: params.dateFrom ? new Date(params.dateFrom) : new Date(),
    to: params.dateTo ? new Date(params.dateTo) : undefined
  });

  const filters: LeadFilters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.status && { status: params.status as LeadStatus }),
    ...(params.campaignType && { campaignType: params.campaignType as 'outbound' | 'inbound' }),
    ...(params.campaignId && { campaignId: params.campaignId }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) }),
    ...(params.dateFrom && { dateFrom: params.dateFrom }),
    ...(params.dateTo && { dateTo: params.dateTo }),
    ...(params.followUpStatus && {
      followUpStatus: params.followUpStatus as 'pending' | 'completed' | 'cancelled' | 'all'
    }),
    ...(params.hasFollowUp && { hasFollowUp: params.hasFollowUp === 'true' })
  };

  const { data } = useSuspenseQuery(leadsQueryOptions(filters));

  const pageCount = Math.ceil(data.total_leads / params.perPage);

  const { table } = useDataTable({
    data: data.leads,
    columns: leadColumns(),
    pageCount,
    shallow: true,
    debounceMs: 500
  });

  const hasActiveFilters =
    params.name ||
    params.status ||
    params.campaignType ||
    params.campaignId ||
    params.dateFrom ||
    params.dateTo ||
    params.followUpStatus ||
    params.hasFollowUp;

  return (
    <div className='space-y-4'>
      <DataTableToolbar table={table} className={cn(hasActiveFilters && 'ring-2 ring-primary')}>
        <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
          {/* Date range filter */}
          <Popover>
            <PopoverTrigger>
              <Button
                variant={params.dateFrom || params.dateTo ? 'default' : 'outline'}
                className='w-full sm:w-auto gap-1'
              >
                <Icons.calendar className='h-4 w-4' />
                <span>
                  {params.dateFrom || params.dateTo
                    ? `${params.dateFrom ? format(new Date(params.dateFrom), 'dd/MM', { locale: sv }) : '...'} – ${params.dateTo ? format(new Date(params.dateTo), 'dd/MM', { locale: sv }) : '...'}`
                    : 'Datum'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-80 p-0' align='start' sideOffset={5}>
              <Calendar
                mode='range'
                selected={dateRange}
                onSelect={setDateRange}
                locale={sv}
                numberOfMonths={2}
              />
              <div className='flex items-center justify-end gap-2 p-2 border-t'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setDateRange({ from: new Date(), to: undefined });
                  }}
                >
                  Rensa
                </Button>
                <Button
                  size='sm'
                  onClick={() => {
                    /* apply handled by onSelect */
                  }}
                >
                  OK
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Follow-up status filter */}
          <Popover>
            <PopoverTrigger>
              <Button
                variant={params.followUpStatus ? 'default' : 'outline'}
                className='w-full sm:w-auto gap-1'
              >
                <Icons.clock className='h-4 w-4' />
                <span>{params.followUpStatus || 'Uppföljning'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-56 p-2' align='start' sideOffset={5}>
              <div className='space-y-1'>
                <label className='flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent'>
                  <input
                    type='radio'
                    name='followUpStatus'
                    checked={!params.followUpStatus}
                    onChange={() => {
                      /* clear filter */
                    }}
                    className='sr-only'
                  />
                  <span>Alla</span>
                </label>
                {['pending', 'completed', 'cancelled'].map((status) => (
                  <label
                    key={status}
                    className='flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent'
                  >
                    <input
                      type='radio'
                      name='followUpStatus'
                      checked={params.followUpStatus === status}
                      onChange={() => {
                        /* handled by URL state */
                      }}
                      className='sr-only'
                    />
                    <span>
                      {status === 'pending'
                        ? 'Väntar'
                        : status === 'completed'
                          ? 'Avslutad'
                          : 'Avbruten'}
                    </span>
                  </label>
                ))}
                <label className='flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent border-t pt-1 mt-1'>
                  <input
                    type='checkbox'
                    checked={params.hasFollowUp === 'true'}
                    onChange={() => {
                      /* handled by URL state */
                    }}
                    className='sr-only'
                  />
                  <span>Har uppföljning</span>
                </label>
              </div>
            </PopoverContent>
          </Popover>

          {/* Campaign ID filter */}
          <Popover>
            <PopoverTrigger>
              <Button
                variant={params.campaignId ? 'default' : 'outline'}
                className='w-full sm:w-auto gap-1'
              >
                <Icons.circle className='h-4 w-4' />
                <span>{params.campaignId || 'Kampanj ID'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-56 p-2' align='start' sideOffset={5}>
              <div className='space-y-1'>
                <label className='flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent'>
                  <input
                    type='radio'
                    name='campaignId'
                    checked={!params.campaignId}
                    onChange={() => { /* clear filter */ }}
                    className='sr-only'
                  />
                  <span>Alla</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent'>
                  <input
                    type='radio'
                    name='campaignId'
                    checked={params.campaignId === 'camp-1'}
                    onChange={() => { /* handled by URL state */ }}
                    className='sr-only'
                  />
                  <span>Q4 Avtalssättning</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent'>
                  <input
                    type='radio'
                    name='campaignId'
                    checked={params.campaignId === 'camp-2'}
                    onChange={() => { /* handled by URL state */ }}
                    className='sr-only'
                  />
                  <span>Support AI</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent'>
                  <input
                    type='radio'
                    name='campaignId'
                    checked={params.campaignId === 'camp-3'}
                    onChange={() => { /* handled by URL state */ }}
                    className='sr-only'
                  />
                  <span>Black Friday</span>
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </DataTableToolbar>
      <DataTable table={table} />
    </div>
  );
}

export function LeadsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
