'use client';

import { Badge } from '@/components/ui/badge';
import { KanbanItem } from '@/components/ui/kanban';
import { Icons } from '@/components/icons';
import type { CallRecord } from '../utils/store';
import { useI18n } from '@/lib/i18n';

const outcomeLabels: Record<
  string,
  {
    sv: string;
    en: string;
    variant: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  }
> = {
  booked: { sv: 'Bokat 🚀', en: 'Booked 🚀', variant: 'default' },
  answered: { sv: 'Svarat', en: 'Answered', variant: 'secondary' },
  missed: { sv: 'Missat', en: 'Missed', variant: 'destructive' },
  voicemail: { sv: 'Röstbrevlåda', en: 'Voicemail', variant: 'outline' },
  busy: { sv: 'Upptaget', en: 'Busy', variant: 'outline' },
  resolved: { sv: 'Löst ✅', en: 'Resolved ✅', variant: 'default' }
};

const campaignTypeLabels: Record<
  string,
  { sv: string; en: string; icon: React.ComponentType<{ className?: string }> }
> = {
  outbound: { sv: 'Utgående', en: 'Outbound', icon: Icons.phoneOutgoing },
  inbound: { sv: 'Ingående', en: 'Inbound', icon: Icons.phoneIncoming }
};

interface CallCardProps {
  call: CallRecord;
}

export function CallCard({ call }: CallCardProps) {
  const { t } = useI18n();

  const outcome = call.outcome
    ? outcomeLabels[call.outcome as keyof typeof outcomeLabels]
    : { sv: '—', en: '—', variant: 'outline' as const };
  const campaignType = campaignTypeLabels[call.campaignType] ?? {
    sv: call.campaignType,
    en: call.campaignType,
    icon: Icons.phone
  };

  return (
    <KanbanItem
      key={call.id}
      value={call.id}
      disabled
      render={
        <div className='bg-card rounded-md border p-3 shadow-xs transition-shadow hover:shadow-sm' />
      }
    >
      <div className='flex flex-col gap-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium truncate'>{call.customerName}</p>
            <p className='text-muted-foreground text-sm truncate'>{call.phoneNumber}</p>
          </div>
          <div className='flex items-center gap-1'>
            <campaignType.icon className='h-3.5 w-3.5 text-muted-foreground' />
            <span className='text-[11px] text-muted-foreground'>{campaignType.sv}</span>
          </div>
        </div>
        <div className='flex items-center justify-between text-xs'>
          {call.duration && (
            <div className='flex items-center gap-1 text-muted-foreground'>
              <Icons.clock className='h-3 w-3' />
              <span className='font-mono tabular-nums'>{call.duration}</span>
            </div>
          )}
          {call.outcome && (
            <Badge variant={outcome.variant} className='gap-1 h-5 px-2 text-[10px]'>
              {outcome.sv}
            </Badge>
          )}
        </div>
        <div className='text-[10px] text-muted-foreground'>
          Startad:{' '}
          {new Date(call.startedAt).toLocaleTimeString('sv-SE', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </KanbanItem>
  );
}
