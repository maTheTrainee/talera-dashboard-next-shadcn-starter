import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// MOCK — visual preview. Wiring pass: swap for the positive-outcomes feed
// (n8n pushes events / query contacts with recent positive outcomes) so the
// dashboard updates on every positive outcome.
type EventType = 'bokat' | 'kvalificerad' | 'uppfoljning';

interface PositiveEvent {
  type: EventType;
  name: string;
  detail: string;
  minutesAgo: number;
}

const MOCK_EVENTS: PositiveEvent[] = [
  {
    type: 'bokat',
    name: 'Anna Andersson',
    detail: '🎉 Möte bokat — torsdag 14:00',
    minutesAgo: 5
  },
  {
    type: 'kvalificerad',
    name: 'Erik Svensson',
    detail: '✅ Kvalificerad prospekt',
    minutesAgo: 12
  },
  {
    type: 'uppfoljning',
    name: 'Maria Larsson',
    detail: '📅 Uppföljning bokad — kl 15:30',
    minutesAgo: 27
  },
  {
    type: 'bokat',
    name: 'Johan Nilsson',
    detail: '🎉 Möte bokat — fredag 10:00',
    minutesAgo: 41
  },
  {
    type: 'kvalificerad',
    name: 'Sara Lindberg',
    detail: '✅ Kvalificerad prospekt',
    minutesAgo: 58
  }
];

const EVENT_META: Record<EventType, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  bokat: { label: 'Bokat möte', variant: 'default' },
  kvalificerad: { label: 'Kvalificerad prospekt', variant: 'secondary' },
  uppfoljning: { label: 'Uppföljning', variant: 'outline' }
};

/**
 * Senaste positiva händelser — the @sales dashboard slot. Distinct from the
 * notification center: this is the dashboard-level feed updating on every
 * positive outcome (bokat möte, kvalificerad prospekt, bokad uppföljning).
 */
export function PositiveEventsCard() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Senaste positiva händelser</CardTitle>
        <CardDescription>
          Bokningar, kvalificerade prospekt och uppföljningar — uppdateras löpande.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {MOCK_EVENTS.map((event, index) => {
            const meta = EVENT_META[event.type];
            return (
              <div key={index} className='flex items-center gap-3'>
                <Badge
                  variant={meta.variant}
                  className='h-5 rounded-sm px-1.5 text-[11px] whitespace-nowrap'
                >
                  {meta.label}
                </Badge>
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <p className='truncate text-sm leading-none font-medium'>{event.name}</p>
                  <p className='text-muted-foreground truncate text-xs'>{event.detail}</p>
                </div>
                <span className='text-muted-foreground text-xs whitespace-nowrap tabular-nums'>
                  {event.minutesAgo} min
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function PositiveEventsSkeleton() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <Skeleton className='h-5 w-48' />
        <Skeleton className='h-4 w-64' />
      </CardHeader>
      <CardContent className='space-y-6'>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className='flex items-center gap-3'>
            <Skeleton className='h-5 w-24 rounded-sm' />
            <Skeleton className='h-8 flex-1' />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}