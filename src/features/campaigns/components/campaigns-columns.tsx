'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Campaign } from '../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const statusLabels: Record<
  string,
  { sv: string; en: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' }
> = {
  draft: { sv: 'Utkast', en: 'Draft', variant: 'ghost' },
  active: { sv: 'Aktiv', en: 'Active', variant: 'default' },
  paused: { sv: 'Pausad', en: 'Paused', variant: 'secondary' },
  completed: { sv: 'Avslutad', en: 'Completed', variant: 'default' }
};

const typeLabels: Record<
  string,
  { sv: string; en: string; icon: React.ComponentType<{ className?: string }> }
> = {
  outbound: {
    sv: 'Utgående - Avtalssättning',
    en: 'Outbound - Appointment Setting',
    icon: Icons.phoneOutgoing
  },
  inbound: { sv: 'Ingående - Support AI', en: 'Inbound - Support AI', icon: Icons.phoneIncoming }
};

const statusOptions = [
  { value: 'draft', label: 'Utkast' },
  { value: 'active', label: 'Aktiv' },
  { value: 'paused', label: 'Pausad' },
  { value: 'completed', label: 'Avslutad' }
];

const typeOptions = [
  { value: 'outbound', label: 'Utgående - Avtalssättning' },
  { value: 'inbound', label: 'Ingående - Support AI' }
];

export const campaignColumns = () => {
  const { t } = useI18n();

  return [
    {
      accessorKey: 'name',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('campaign.campaign-name')} />
      ),
      cell: ({ cell }) => <div className='font-medium'>{cell.getValue<Campaign['name']>()}</div>,
      meta: {
        label: t('campaign.campaign-name'),
        placeholder: 'Sök kampanj...',
        variant: 'text' as const,
        icon: Icons.text
      },
      enableColumnFilter: true
    },
    {
      id: 'type',
      accessorKey: 'type',
      enableSorting: false,
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('campaign.campaign-type')} />
      ),
      cell: ({ cell }) => {
        const type = cell.getValue<Campaign['type']>();
        const typeInfo = typeLabels[type] ?? {
          sv: type,
          en: type,
          icon: Icons.phone
        };
        return (
          <Badge variant='outline' className='gap-1'>
            <typeInfo.icon className='h-3 w-3' />
            {typeInfo.sv}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: t('campaign.campaign-type'),
        variant: 'multiSelect' as const,
        options: typeOptions
      }
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
        const statusInfo = statusLabels[status] ?? {
          sv: status,
          en: status,
          variant: 'outline' as const
        };
        return (
          <Badge variant={statusInfo.variant} className='capitalize'>
            {statusInfo.sv}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: 'Status',
        variant: 'multiSelect' as const,
        options: statusOptions
      }
    },
    {
      accessorKey: 'totalNumbers',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Totala nummer' />
      ),
      cell: ({ cell }) => (
        <div className='font-mono tabular-nums'>
          {cell.getValue<Campaign['totalNumbers']>().toLocaleString('sv-SE')}
        </div>
      )
    },
    {
      accessorKey: 'calledNumbers',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Ringda' />
      ),
      cell: ({ cell }) => (
        <div className='font-mono tabular-nums'>
          {cell.getValue<Campaign['calledNumbers']>().toLocaleString('sv-SE')}
        </div>
      )
    },
    {
      accessorKey: 'answeredCalls',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Svarade' />
      ),
      cell: ({ cell }) => (
        <div className='font-mono tabular-nums'>
          {cell.getValue<Campaign['answeredCalls']>().toLocaleString('sv-SE')}
        </div>
      )
    },
    {
      accessorKey: 'bookedMeetings',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Bokade möten' />
      ),
      cell: ({ cell }) => (
        <div className='font-mono tabular-nums'>
          {cell.getValue<Campaign['bookedMeetings']>().toLocaleString('sv-SE')}
        </div>
      )
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Skapad' />
      ),
      cell: ({ cell }) => {
        const date = cell.getValue<Campaign['createdAt']>();
        return (
          <span className='text-sm'>
            {format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: sv })}
          </span>
        );
      }
    },
    {
      accessorKey: 'scheduleDate',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Schemalagd' />
      ),
      cell: ({ cell }) => {
        const date = cell.getValue<Campaign['scheduleDate']>();
        const startTime = cell.row.original.scheduleStartTime;
        const endTime = cell.row.original.scheduleEndTime;

        if (!date) return <span className='text-muted-foreground text-sm'>—</span>;

        return (
          <span className='text-sm'>
            {format(new Date(date), 'yyyy-MM-dd', { locale: sv })}
            {startTime && endTime && (
              <span className='ml-2'>
                {startTime}–{endTime}
              </span>
            )}
          </span>
        );
      }
    },
    {
      accessorKey: 'startedAt',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Startad' />
      ),
      cell: ({ cell }) => {
        const date = cell.getValue<Campaign['startedAt']>();
        if (!date) return <span className='text-muted-foreground text-sm'>—</span>;
        return (
          <span className='text-sm'>
            {format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: sv })}
          </span>
        );
      }
    },
    {
      accessorKey: 'completedAt',
      header: ({ column }: { column: Column<Campaign, unknown> }) => (
        <DataTableColumnHeader column={column} title='Avslutad' />
      ),
      cell: ({ cell }) => {
        const date = cell.getValue<Campaign['completedAt']>();
        if (!date) return <span className='text-muted-foreground text-sm'>—</span>;
        return (
          <span className='text-sm'>
            {format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: sv })}
          </span>
        );
      }
    }
  ] as ColumnDef<Campaign>[];
};
