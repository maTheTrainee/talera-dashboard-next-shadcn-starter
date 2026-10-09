'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Campaign } from '../../api/types';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { CAMPAIGN_STATUS_OPTIONS } from '../../constants/campaign-options';

/**
 * Column factory — the row click target (campaign name + prospekt count)
 * opens the kampanjprospekt-popup. Utgående nummer is not a list column —
 * it is caller-ID config and lives in the edit sheet + cockpit.
 */
export function getColumns(
  onOpenProspects: (campaign: Campaign) => void
): ColumnDef<Campaign>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Kampanj' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onOpenProspects(row.original)}
          className='flex flex-col text-left underline-offset-4 hover:underline'
        >
          <span className='font-medium'>{row.original.name}</span>
          <span className='text-muted-foreground line-clamp-1 max-w-sm text-xs'>
            {row.original.description}
          </span>
        </button>
      ),
      meta: {
        label: 'Kampanj',
        placeholder: 'Sök kampanjer...',
        variant: 'text' as const
      },
      enableColumnFilter: true
    },
    {
      id: 'prospect_count',
      accessorKey: 'prospect_count',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Prospekter' />
      ),
      cell: ({ cell, row }) => (
        <button
          type='button'
          onClick={() => onOpenProspects(row.original)}
          aria-label={`Visa prospekter i ${row.original.name}`}
          className='text-muted-foreground text-sm tabular-nums underline-offset-4 hover:underline'
        >
          {cell.getValue<Campaign['prospect_count']>() ?? 0}
        </button>
      )
    },
    {
      id: 'status',
      accessorKey: 'status',
      enableSorting: false,
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ cell }) => {
        const status = cell.getValue<Campaign['status']>();
        const variant =
          status === 'live' ? 'default' : status === 'pausad' ? 'secondary' : 'outline';
        return (
          <Badge variant={variant} className='capitalize'>
            {status}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: 'status',
        variant: 'multiSelect' as const,
        options: CAMPAIGN_STATUS_OPTIONS
      }
    },
    {
      id: 'scheduled_start',
      accessorKey: 'scheduled_start',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Start' />
      ),
      cell: ({ cell }) => (
        <span className='text-sm'>
          {new Date(cell.getValue<string>()).toLocaleString('sv-SE')}
        </span>
      )
    },
    {
      id: 'scheduled_end',
      accessorKey: 'scheduled_end',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Slut' />
      ),
      cell: ({ cell }) => (
        <span className='text-sm'>
          {new Date(cell.getValue<string>()).toLocaleString('sv-SE')}
        </span>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => <CellAction data={row.original} />
    }
  ];
}
