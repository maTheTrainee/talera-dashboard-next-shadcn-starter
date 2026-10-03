'use client';

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import { useCampaignType } from './campaign-toggle';
import type { CallEvent } from '../api/types';

interface RecentEventsProps {
  events: CallEvent[];
}

const outcomeLabels: Record<
  string,
  { sv: string; en: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  booked: { sv: 'Bokat 🚀', en: 'Booked 🚀', variant: 'default' },
  answered: { sv: 'Svarat', en: 'Answered', variant: 'secondary' },
  missed: { sv: 'Missat', en: 'Missed', variant: 'destructive' },
  voicemail: { sv: 'Röstbrevlåda', en: 'Voicemail', variant: 'outline' },
  busy: { sv: 'Upptaget', en: 'Busy', variant: 'outline' },
  resolved: { sv: 'Löst ✅', en: 'Resolved ✅', variant: 'default' }
};

const outcomeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  booked: Icons.check,
  answered: Icons.phoneIncoming,
  missed: Icons.alertCircle,
  voicemail: Icons.chat,
  busy: Icons.circleX,
  resolved: Icons.checks
};

export function RecentEvents({ events }: RecentEventsProps) {
  const { t } = useI18n();
  const { campaignType } = useCampaignType();

  const filteredEvents = events.filter((e) => e.campaignType === campaignType);

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>{t('overview.recent-events')}</CardTitle>
        <CardDescription>
          {campaignType === 'outbound' ? 'Senaste utgående samtal' : 'Senaste inkommande samtal'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {filteredEvents.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>{t('common.loading')}</div>
          ) : (
            filteredEvents.map((event, index) => {
              const outcome = outcomeLabels[event.outcome] ?? {
                sv: event.outcome,
                en: event.outcome,
                variant: 'outline'
              };
              const OutcomeIcon = outcomeIcons[event.outcome] ?? Icons.info;

              return (
                <div key={index} className='flex items-center gap-4'>
                  <div className='flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                    <OutcomeIcon className='h-5 w-5 text-primary' />
                  </div>
                  <div className='flex-1 min-w-0 space-y-1'>
                    <p className='text-sm font-medium truncate'>{event.customerName}</p>
                    <p className='text-muted-foreground text-sm truncate'>{event.phoneNumber}</p>
                  </div>
                  <div className='flex items-center gap-3 text-sm'>
                    <span className='font-mono tabular-nums text-muted-foreground'>
                      {event.duration}
                    </span>
                    <Badge variant={outcome.variant} className='gap-1'>
                      <OutcomeIcon className='h-3 w-3' />
                      {outcome.sv}
                    </Badge>
                    <time className='text-[11px] text-muted-foreground whitespace-nowrap'>
                      {new Date(event.timestamp).toLocaleString('sv-SE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
