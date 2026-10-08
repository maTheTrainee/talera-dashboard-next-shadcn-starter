'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Contact } from '../../api/types';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { PROSPECT_STATUS_OPTIONS } from './options';

export const columns: ColumnDef<Contact>[] = [
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
    id: 'status',
    accessorKey: 'status',
    enableSorting: false,
    header: ({ column }: { column: Column<Contact, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ringstatus' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Contact['status']>();
      const variant =
        status === 'avslutat' || status === 'i_samtal'
          ? 'default'
          : status === 'ringer'
            ? 'secondary'
            : 'outline';
      return (
        <Badge variant={variant} className='capitalize'>
          {status.replace('_', ' ')}
        </Badge>
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
    id: 'call_outcome',
    accessorKey: 'call_outcome',
    header: ({ column }: { column: Column<Contact, unknown> }) => (
      <DataTableColumnHeader column={column} title='Utdata' />
    ),
    cell: ({ cell }) => {
      const outcome = cell.getValue<Contact['call_outcome']>();
      return <span className='text-muted-foreground text-sm'>{outcome ?? '—'}</span>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
