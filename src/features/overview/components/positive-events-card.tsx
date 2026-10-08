'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProspectDialog, type ProspectPreview } from './prospect-dialog';

// MOCK — visual preview. Wiring pass: swap for the positive-outcomes feed
// (n8n pushes events / query contacts with recent positive outcomes) and
// PROSPECT_MOCKS for the real contact + latest call.
type EventType = 'bokat' | 'kvalificerad' | 'uppfoljning';

interface PositiveEvent {
  type: EventType;
  name: string;
  company: string;
  detail: string;
  minutesAgo: number;
}

const MOCK_EVENTS: PositiveEvent[] = [
  {
    type: 'bokat',
    name: 'Anna Andersson',
    company: 'Acme AB',
    detail: '🎉 Möte bokat — torsdag 14:00',
    minutesAgo: 5
  },
  {
    type: 'kvalificerad',
    name: 'Erik Svensson',
    company: 'Nordica AB',
    detail: '✅ Kvalificerad prospekt',
    minutesAgo: 12
  },
  {
    type: 'uppfoljning',
    name: 'Maria Larsson',
    company: 'Bergström & Co',
    detail: '📅 Uppföljning bokad — kl 15:30',
    minutesAgo: 27
  },
  {
    type: 'bokat',
    name: 'Johan Nilsson',
    company: 'Acme AB',
    detail: '🎉 Möte bokat — fredag 10:00',
    minutesAgo: 41
  },
  {
    type: 'kvalificerad',
    name: 'Sara Lindberg',
    company: 'Fjällbacka Handel',
    detail: '✅ Kvalificerad prospekt',
    minutesAgo: 58
  }
];

const EVENT_META: Record<
  EventType,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  bokat: { label: 'Bokat möte', variant: 'default' },
  kvalificerad: { label: 'Kvalificerad prospekt', variant: 'secondary' },
  uppfoljning: { label: 'Uppföljning', variant: 'outline' }
};

// Mock prospect cards behind each event — the popup shows the contact card
// + samtalshistorik so the user can follow what happened.
const PROSPECT_MOCKS: Record<string, ProspectPreview> = {
  'Anna Andersson': {
    name: 'Anna Andersson',
    company: 'Acme AB',
    phone: '+46 70 123 45 67',
    status: 'avslutat',
    attempts: 2,
    max: 3,
    lastSummary:
      'Anna var intresserad och bokade ett möte till torsdag 14:00. Bra samtal, 4 minuter.',
    lastTranscript: [
      { speaker: 'agent', text: 'Hej Anna! Det är din AI-assistent från Talera. Har du en minut?' },
      { speaker: 'user', text: 'Ja, säg till!' },
      { speaker: 'agent', text: 'Perfekt — jag bokar in ett möte till torsdag 14:00. Fungerar det?' },
      { speaker: 'user', text: 'Ja det fungerar fint.' }
    ]
  },
  'Erik Svensson': {
    name: 'Erik Svensson',
    company: 'Nordica AB',
    phone: '+46 73 987 65 43',
    status: 'kvalificerad',
    attempts: 1,
    max: 3,
    lastSummary:
      'Erik kvalificerades som prospekt — stor budget, nära inköpsbeslut. Skickar offert.',
    lastTranscript: [
      { speaker: 'agent', text: 'Hej Erik! Ser att ni utvärderar röstlösningar — stämmer det?' },
      { speaker: 'user', text: 'Stämmer, vi sätter ihop kravspec just nu.' }
    ]
  },
  'Maria Larsson': {
    name: 'Maria Larsson',
    company: 'Bergström & Co',
    phone: '+46 76 111 22 33',
    status: 'uppföljning',
    followUpAt: '2026-05-03 15:30',
    attempts: 2,
    max: 3,
    lastSummary:
      'Maria bad oss ringa tillbaka efter klockan 15 — uppföljning bokad till 3 maj 15:30.',
    lastTranscript: [
      { speaker: 'agent', text: 'Hej Maria! Ringer vi tillbaka vid ett bättre tillfälle?' },
      { speaker: 'user', text: 'Ja, ring gärna igen efter 15 imorgon.' }
    ]
  },
  'Johan Nilsson': {
    name: 'Johan Nilsson',
    company: 'Acme AB',
    phone: '+46 70 456 78 90',
    status: 'ringer',
    attempts: 2,
    max: 3
  },
  'Sara Lindberg': {
    name: 'Sara Lindberg',
    company: 'Fjällbacka Handel',
    phone: '+46 76 998 87 76',
    status: 'i_samtal',
    attempts: 1,
    max: 3
  }
};

/**
 * Senaste positiva händelser — the @sales dashboard slot. Distinct from the
 * notification center: this is the dashboard-level feed updating on every
 * positive outcome (bokat möte, kvalificerad prospekt, bokad uppföljning).
 * Clicking an event opens the prospect popup with the contact card +
 * samtalshistorik.
 */
export function PositiveEventsCard() {
  const [selected, setSelected] = React.useState<PositiveEvent | null>(null);
  const selectedProspect = selected ? PROSPECT_MOCKS[selected.name] : undefined;

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Senaste positiva händelser</CardTitle>
        <CardDescription>
          Bokningar, kvalificerade prospekt och uppföljningar — uppdateras löpande. Klicka för
          detaljer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {MOCK_EVENTS.map((event, index) => {
            const meta = EVENT_META[event.type];
            const hasProspect = !!PROSPECT_MOCKS[event.name];
            return (
              <button
                key={index}
                type='button'
                onClick={() => hasProspect && setSelected(event)}
                disabled={!hasProspect}
                className='hover:bg-muted/40 focus-visible:ring-ring flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none'
              >
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
              </button>
            );
          })}
        </div>
      </CardContent>
      <ProspectDialog
        open={!!selected}
        onClose={() => setSelected(null)}
        prospect={selectedProspect}
      />
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
      <CardContent className='space-y-3'>
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
