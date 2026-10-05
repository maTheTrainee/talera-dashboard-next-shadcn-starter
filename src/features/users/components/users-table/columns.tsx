'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Lead } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';

const statusLabels: Record<
  string,
  { sv: string; en: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  new: { sv: 'Ny', en: 'New', variant: 'default' },
  contacted: { sv: 'Kontaktad', en: 'Contacted', variant: 'secondary' },
  qualified: { sv: 'Kvalificerad', en: 'Qualified', variant: 'default' },
  booked: { sv: 'Bokat 🚀', en: 'Booked 🚀', variant: 'default' },
  closed: { sv: 'Avslutad', en: 'Closed', variant: 'secondary' },
  lost: { sv: 'Förlorad', en: 'Lost', variant: 'destructive' }
};

const followUpStatusLabels: Record<
  string,
  { sv: string; en: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { sv: 'Väntar', en: 'Pending', variant: 'default' },
  completed: { sv: 'Avslutad', en: 'Completed', variant: 'secondary' },
  cancelled: { sv: 'Avbruten', en: 'Cancelled', variant: 'destructive' }
};

const statusOptions = [
  { value: 'new', label: 'Ny' },
  { value: 'contacted', label: 'Kontaktad' },
  { value: 'qualified', label: 'Kvalificerad' },
  { value: 'booked', label: 'Bokat' },
  { value: 'closed', label: 'Avslutad' },
  { value: 'lost', label: 'Förlorad' }
];

const campaignTypeOptions = [
  { value: 'outbound', label: 'Utgående' },
  { value: 'inbound', label: 'Ingående' }
];

const followUpStatusOptions = [
  { value: 'pending', label: 'Väntar' },
  { value: 'completed', label: 'Avslutad' },
  { value: 'cancelled', label: 'Avbruten' }
];

export const leadColumns = () => {
  const { t } = useI18n();

  return [
    {
      accessorKey: 'phoneNumber',
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('leads.phone')} />
      ),
      cell: ({ cell }) => (
        <div className='font-mono text-sm'>{cell.getValue<Lead['phoneNumber']>()}</div>
      ),
      meta: {
        label: t('leads.phone'),
        placeholder: t('leads.search'),
        variant: 'text' as const,
        icon: Icons.phone
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'customerName',
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('leads.name')} />
      ),
      cell: ({ cell }) => (
        <div className='font-medium'>{cell.getValue<Lead['customerName']>()}</div>
      ),
      meta: {
        label: t('leads.name'),
        placeholder: t('leads.search'),
        variant: 'text' as const,
        icon: Icons.user
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'campaignName',
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title='Kampanj' />
      ),
      cell: ({ cell }) => (
        <div className='max-w-[200px] truncate text-sm'>
          {cell.getValue<Lead['campaignName']>() ?? '—'}
        </div>
      ),
      meta: {
        label: 'Kampanj',
        placeholder: 'Sök kampanj...',
        variant: 'text' as const,
        icon: Icons.phone
      },
      enableColumnFilter: true
    },
    {
      accessorKey: 'campaignId',
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title='Kampanj ID' />
      ),
      cell: ({ cell }) => (
        <div className='max-w-[150px] truncate text-xs text-muted-foreground font-mono'>
          {cell.getValue<Lead['campaignId']>() ?? '—'}
        </div>
      ),
      meta: {
        label: 'Kampanj ID',
        variant: 'text' as const,
        icon: Icons.hash
      },
      enableColumnFilter: true
    },
    {
      id: 'status',
      accessorKey: 'status',
      enableSorting: false,
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('leads.status')} />
      ),
      cell: ({ cell }) => {
        const status = cell.getValue<Lead['status']>();
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
        label: t('leads.status'),
        variant: 'multiSelect' as const,
        options: statusOptions
      }
    },
    {
      id: 'followUpStatus',
      accessorKey: 'followUpStatus',
      enableSorting: false,
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title='Uppföljning' />
      ),
      cell: ({ cell }) => {
        const followUpAt = cell.row.original.followUpAt;
        const followUpDateTime = cell.row.original.followUpDateTime;
        const followUpStatus = cell.getValue<Lead['followUpStatus']>();

        if (!followUpAt && !followUpDateTime) {
          return <span className='text-muted-foreground text-sm'>—</span>;
        }

        const statusInfo = followUpStatusLabels[followUpStatus ?? 'pending'] ?? {
          sv: 'Okänd',
          en: 'Unknown',
          variant: 'outline' as const
        };

        // Use followUpDateTime if available, otherwise followUpAt
        const dateTimeToShow = followUpDateTime || followUpAt;
        const followUpDate = new Date(dateTimeToShow);
        const formattedDate = followUpDate.toLocaleString('sv-SE', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div className='flex items-center gap-2'>
            <Badge variant={statusInfo.variant} className='capitalize'>
              {statusInfo.sv}
            </Badge>
            <span className='text-sm text-muted-foreground'>{formattedDate}</span>
            {cell.row.original.followUpNotes && (
              <span className='text-xs text-muted-foreground max-w-[150px] truncate'>
                {cell.row.original.followUpNotes}
              </span>
            )}
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: 'Uppföljning',
        variant: 'multiSelect' as const,
        options: followUpStatusOptions
      }
    },
    {
      accessorKey: 'duration',
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('leads.duration')} />
      ),
      cell: ({ cell }) => {
        const seconds = cell.getValue<Lead['duration']>();
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return (
          <span className='font-mono tabular-nums'>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        );
      }
    },
    {
      accessorKey: 'aiSummary',
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('leads.ai-summary')} />
      ),
      cell: ({ cell }) => (
        <div className='max-w-[300px] truncate text-sm text-muted-foreground'>
          {cell.getValue<Lead['aiSummary']>()}
        </div>
      )
    },
    {
      id: 'campaignType',
      accessorKey: 'campaignType',
      enableSorting: false,
      header: ({ column }: { column: Column<Lead, unknown> }) => (
        <DataTableColumnHeader column={column} title='Kampanjtyp' />
      ),
      cell: ({ cell }) => {
        const type = cell.getValue<Lead['campaignType']>();
        const label = type === 'outbound' ? 'Utgående' : 'Ingående';
        const Icon = type === 'outbound' ? Icons.phoneOutgoing : Icons.phoneIncoming;
        return (
          <Badge variant='outline' className='gap-1'>
            <Icon className='h-3 w-3' />
            {label}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: 'Kampanjtyp',
        variant: 'multiSelect' as const,
        options: campaignTypeOptions
      }
    }
  ] as ColumnDef<Lead>[];
};
