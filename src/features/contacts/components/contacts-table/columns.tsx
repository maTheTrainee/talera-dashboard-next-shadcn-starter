'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Contact } from '../../api/types';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { PROSPECT_STATUS_OPTIONS } from './options';

export type CampaignFilterOption = { value: string; label: string };

/**
 * Column factory — the Kampanj filter options are the tenant's campaign names
 * (generated from campaignsQueryOptions by the table). Empty options = the
 * Kampanj column is dropped entirely (inbound-only tenants have no campaigns).
 * Utfall/Utdata is gone — the Ringstatus badge carries the outcome state;
 * the Sammanfattning column shows the last call's n8n summary instead.
 */
export function getColumns(
  campaignOptions: CampaignFilterOption[]
): ColumnDef<Contact>[] {
  return [
    {
      id: 'name',
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      header: ({ column }: { column: Column<Contact, unknown> }) => (
        <DataTableColumnHeader column={column} title='Kontakt' />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium'>
            {row.original.first_name} {row.original.last_name}
          </span>
          {row.original.company && (
            <span className='text-muted-foreground text-xs'>{row.original.company}</span>
          )}
          <span className='text-muted-foreground text-xs'>{row.original.email}</span>
        </div>
      ),
      meta: {
        label: 'Kontakt',
        placeholder: 'Sök kontakter...',
        variant: 'text' as const
      },
      enableColumnFilter: true
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: ({ column }: { column: Column<Contact, unknown> }) => (
        <DataTableColumnHeader column={column} title='Telefon' />
      ),
      cell: ({ row }) => (
        <a
          href={`tel:${row.original.phone}`}
          className='text-sm underline-offset-4 hover:underline'
        >
          {row.original.phone}
        </a>
      )
    },
    {
      id: 'org_number',
      accessorKey: 'org_number',
      header: ({ column }: { column: Column<Contact, unknown> }) => (
        <DataTableColumnHeader column={column} title='Org.nummer' />
      ),
      cell: ({ cell }) => {
        const orgNumber = cell.getValue<Contact['org_number']>();
        return (
          <span className='text-muted-foreground text-sm tabular-nums'>
            {orgNumber ?? '—'}
          </span>
        );
      }
    },
    ...(campaignOptions.length > 0
      ? [
          {
            id: 'campaign_name',
            accessorKey: 'campaign_name',
            enableSorting: false,
            header: ({ column }: { column: Column<Contact, unknown> }) => (
              <DataTableColumnHeader column={column} title='Kampanj' />
            ),
            cell: ({ cell }: { cell: { getValue: <T,>() => T | null } }) => {
              const campaignName = cell.getValue<Contact['campaign_name']>();
              return campaignName ? (
                <Badge variant='secondary' className='w-fit'>
                  {campaignName}
                </Badge>
              ) : (
                <span className='text-muted-foreground text-sm'>—</span>
              );
            },
            enableColumnFilter: true,
            meta: {
              label: 'Kampanj',
              variant: 'multiSelect' as const,
              options: campaignOptions
            }
          } as ColumnDef<Contact>
        ]
      : []),
    {
      id: 'status',
      accessorKey: 'status',
      enableSorting: false,
      header: ({ column }: { column: Column<Contact, unknown> }) => (
        <DataTableColumnHeader column={column} title='Ringstatus' />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === 'avslutat' || status === 'i_samtal'
            ? 'default'
            : status === 'ringer' || status === 'uppföljning'
              ? 'secondary'
              : 'outline';
        return (
          <div className='flex flex-col'>
            <Badge variant={variant} className='w-fit capitalize'>
              {status.replace('_', ' ')}
            </Badge>
            {status === 'uppföljning' && row.original.follow_up_at && (
              <span className='text-muted-foreground text-xs'>
                {new Date(row.original.follow_up_at).toLocaleString('sv-SE', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </span>
            )}
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: 'status',
        variant: 'multiSelect' as const,
        options: PROSPECT_STATUS_OPTIONS
      }
    },
    {
      id: 'contact_attempts',
      accessorKey: 'contact_attempts',
      header: ({ column }: { column: Column<Contact, unknown> }) => (
        <DataTableColumnHeader column={column} title='Kontaktförsök' />
      ),
      cell: ({ cell }) => {
        const attempts = cell.getValue<Contact['contact_attempts']>();
        return <span className='text-muted-foreground text-sm'>{attempts ?? 0}</span>;
      }
    },
    {
      id: 'last_contacted_at',
      accessorKey: 'last_contacted_at',
      header: ({ column }: { column: Column<Contact, unknown> }) => (
        <DataTableColumnHeader column={column} title='Senast' />
      ),
      cell: ({ cell }) => {
        const last = cell.getValue<Contact['last_contacted_at']>();
        return (
          <span className='text-muted-foreground text-sm'>
            {last
              ? new Date(last).toLocaleString('sv-SE', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })
              : '—'}
          </span>
        );
      }
    },
    {
      id: 'call_summary',
      accessorKey: 'call_summary',
      header: ({ column }: { column: Column<Contact, unknown> }) => (
        <DataTableColumnHeader column={column} title='Sammanfattning' />
      ),
      cell: ({ cell }) => {
        const summary = cell.getValue<Contact['call_summary']>();
        return (
          <span className='text-muted-foreground line-clamp-2 block max-w-[220px] text-sm'>
            {summary ?? '—'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => <CellAction data={row.original} />
    }
  ];
}
