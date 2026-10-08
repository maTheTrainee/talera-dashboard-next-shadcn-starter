'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Campaign } from '../../api/types';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { CAMPAIGN_STATUS_OPTIONS } from '../../constants/campaign-options';

export const columns: ColumnDef<Campaign>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Campaign, unknown> }) => (
      <DataTableColumnHeader column={column} title='Kampanj' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        <span className='text-muted-foreground line-clamp-1 max-w-sm text-xs'>
          {row.original.description}
        </span>
      </div>
    ),
    meta: {
      label: 'Kampanj',
      placeholder: 'Sök kampanjer...',
      variant: 'text' as const
    },
    enableColumnFilter: true
  },
  {
    id: 'outbound_number',
    accessorKey: 'outbound_number',
    header: ({ column }: { column: Column<Campaign, unknown> }) => (
      <DataTableColumnHeader column={column} title='Nummer' />
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