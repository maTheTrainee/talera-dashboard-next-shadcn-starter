'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// MOCK — samtalshistorik förhandsvisning. Wiring pass: swap for
// useQuery(campaignCallOptions(...)) + /api/calls — the ?callId=[ID] deep
// links select that call directly. call_type (utgående/inkommande/intern)
// comes from n8n per product line.

type CallType = 'utgående' | 'inkommande' | 'intern';

interface HistoryCall {
  id: string;
  callId: string;
  callType: CallType;
  name: string;
  company: string;
  orgNumber: string;
  phone: string;
  date: string;
  duration: string;
  outcome: string;
  summary: string;
  transcript: { speaker: 'user' | 'agent'; text: string }[];
}

const CALL_TYPE_META: Record<CallType, { label: string; className: string }> = {
  'utgående': { label: 'Utgående', className: 'bg-blue-500/15 text-blue-600' },
  'inkommande': { label: 'Inkommande', className: 'bg-green-500/15 text-green-700' },
  'intern': { label: 'Intern', className: 'bg-purple-500/15 text-purple-600' }
};

const MOCK_CALLS: HistoryCall[] = [
  {
    id: '1',
    callId: 'uv-call-8f3a2b1c',
    callType: 'utgående',
    name: 'Anna Andersson',
    company: 'Acme AB',
    orgNumber: '556123-4567',
    phone: '+46 70 123 45 67',
    date: 'idag 13:42',
    duration: '4 min 12 s',
    outcome: 'Bokat möte',
    summary:
      'Anna var intresserad och bokade ett möte till torsdag 14:00. Positiv ton, frågade om priser för Team-paketet.',
    transcript: [
      { speaker: 'agent', text: 'Hej Anna! Det är din AI-assistent från Talera. Har du en minut?' },
      { speaker: 'user', text: 'Ja, säg till!' },
      { speaker: 'agent', text: 'Perfekt — vi hjälper företag att nå kunder med AI-röstsamtal. Hur ser er kundlista ut idag?' },
      { speaker: 'user', text: 'Vi har ungefär 400 kontakter vi vill ringa.' },
      { speaker: 'agent', text: 'Vårt Team-paket klarar det — jag bokar in ett möte till torsdag 14:00. Fungerar det?' },
      { speaker: 'user', text: 'Ja det fungerar fint.' },
      { speaker: 'agent', text: 'Tack Anna — mötet är bokat. Vi hörs torsdag!' }
    ]
  },
  {
    id: '2',
    callId: 'uv-call-2e7f9a4d',
    callType: 'inkommande',
    name: 'Kund — okänd nummerpresentatör',
    company: 'Receptionist',
    orgNumber: '—',
    phone: '+46 8 555 100 22',
    date: 'idag 14:10',
    duration: '1 min 52 s',
    outcome: 'Besvarad',
    summary:
      'Inkommande samtal besvarat av receptionisten — hänvisade till support och vidarekopplade.',
    transcript: [
      { speaker: 'agent', text: 'Talera, Goddag! Hur kan jag hjälpa er?' },
      { speaker: 'user', text: 'Hej, jag söker er supportavdelning.' },
      { speaker: 'agent', text: 'Självklart — jag förmedlar er till supporten direkt.' }
    ]
  },
  {
    id: '3',
    callId: 'uv-call-3a8c2d7e',
    callType: 'intern',
    name: 'Medarbetare — internt stöd',
    company: 'Intern',
    orgNumber: '—',
    phone: 'intern',
    date: 'idag 14:25',
    duration: '2 min 15 s',
    outcome: 'Fråga besvarad',
    summary:
      'Medarbetare frågade efter försäljningspratet för Team-paketet — AI-assistenten guida igenom manualen.',
    transcript: [
      { speaker: 'user', text: 'Vad säger jag om priset för Team-paketet?' },
      { speaker: 'agent', text: 'Team-paketet kostar 30 900 kr per månad och inkluderar 2 röstagenter, 2 kampanjer och 2 utgående nummer.' }
    ]
  },
  {
    id: '4',
    callId: 'uv-call-9d4e3f2a',
    callType: 'utgående',
    name: 'Erik Svensson',
    company: 'Nordica AB',
    orgNumber: '556987-1234',
    phone: '+46 73 987 65 43',
    date: 'idag 11:18',
    duration: '2 min 45 s',
    outcome: 'Kvalificerad prospekt',
    summary:
      'Erik kvalificerades som prospekt — stor budget, nära inköpsbeslut. Skickar offert.',
    transcript: [
      { speaker: 'agent', text: 'Hej Erik! Ser att ni utvärderar röstlösningar — stämmer det?' },
      { speaker: 'user', text: 'Stämmer, vi sätter ihop kravspec just nu.' },
      { speaker: 'agent', text: 'Då är ni i rätt skede. Skickar en offert som passar er kravspec.' }
    ]
  },
  {
    id: '5',
    callId: 'uv-call-7c2d1e9b',
    callType: 'utgående',
    name: 'Maria Larsson',
    company: 'Bergström & Co',
    orgNumber: '556456-7890',
    phone: '+46 76 111 22 33',
    date: 'igår 16:05',
    duration: '1 min 38 s',
    outcome: 'Uppföljning bokad',
    summary:
      'Maria bad oss ringa tillbaka efter klockan 15 — uppföljning bokad till 3 maj 15:30.',
    transcript: [
      { speaker: 'agent', text: 'Hej Maria! Ringer vi tillbaka vid ett bättre tillfälle?' },
      { speaker: 'user', text: 'Ja, ring gärna igen efter 15 imorgon.' },
      { speaker: 'agent', text: 'Noterar — jag bokar en uppföljning. Vi ringer tillbaka då!' }
    ]
  }
];

const TYPE_FILTERS: { value: CallType | 'alla'; label: string }[] = [
  { value: 'alla', label: 'Alla' },
  { value: 'utgående', label: 'Utgående' },
  { value: 'inkommande', label: 'Inkommande' },
  { value: 'intern', label: 'Intern' }
];

/**
 * Samtalshistorik — the unified history across product lines: utgående,
 * inkommande och interna samtal med filterflikar. List (namn, företag,
 * org.nummer, call-id, sammanfattning) + detail (summary + transcript).
 */
export function CallHistoryView() {
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<CallType | 'alla'>('alla');
  const [selectedId, setSelectedId] = React.useState(MOCK_CALLS[0]?.id ?? '');

  const filtered = MOCK_CALLS.filter(
    (call) =>
      (typeFilter === 'alla' || call.callType === typeFilter) &&
      (call.name.toLowerCase().includes(search.toLowerCase()) ||
        call.company.toLowerCase().includes(search.toLowerCase()))
  );
  const selected =
    MOCK_CALLS.find((call) => call.id === selectedId) ?? filtered[0];

  return (
    <div className='grid min-h-0 flex-1 gap-4 lg:grid-cols-[380px_1fr]'>
      {/* Call list */}
      <Card className='flex flex-col gap-3 rounded-2xl p-3'>
        <Tabs
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as CallType | 'alla')}
        >
          <TabsList className='w-full'>
            {TYPE_FILTERS.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value} className='flex-1'>
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <label htmlFor='call-search' className='sr-only'>
          Sök samtal
        </label>
        <Input
          id='call-search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Sök namn eller företag...'
          className='w-full rounded-2xl'
        />
        <div className='flex-1 space-y-2 overflow-y-auto pr-1'>
          {filtered.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-xs'>
              Inga samtal hittades
            </p>
          ) : null}
          {filtered.map((call) => {
            const typeMeta = CALL_TYPE_META[call.callType];
            return (
              <button
                key={call.id}
                type='button'
                onClick={() => setSelectedId(call.id)}
                aria-current={call.id === selected?.id ? 'true' : undefined}
                className={cn(
                  'focus-visible:ring-ring relative flex w-full flex-col gap-1.5 rounded-xl border border-transparent p-3 text-left transition-all focus-visible:ring-2 focus-visible:outline-none',
                  call.id === selected?.id
                    ? 'border-primary/40 bg-primary/10'
                    : 'hover:bg-muted/40'
                )}
              >
                <div className='flex items-start justify-between gap-2'>
                  <p className='text-sm font-semibold'>{call.name}</p>
                  <span className='text-muted-foreground shrink-0 text-[0.65rem]'>
                    {call.date}
                  </span>
                </div>
                <p className='text-muted-foreground text-xs'>
                  {call.company}
                  {call.orgNumber !== '—' ? ` · ${call.orgNumber}` : ''}
                </p>
                <p className='text-muted-foreground line-clamp-1 text-xs'>{call.summary}</p>
                <div className='flex flex-wrap gap-1'>
                  <Badge
                    variant='outline'
                    className={cn('h-5 rounded-sm px-1.5 text-[10px]', typeMeta.className)}
                  >
                    {typeMeta.label}
                  </Badge>
                  <Badge variant='outline' className='h-5 rounded-sm px-1.5 text-[10px]'>
                    {call.outcome}
                  </Badge>
                  <Badge variant='secondary' className='h-5 rounded-sm px-1.5 text-[10px]'>
                    {call.duration}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Call detail */}
      <Card className='flex min-h-0 flex-col gap-4 rounded-2xl p-4'>
        {selected ? (
          <>
            <div className='flex items-start justify-between gap-3 border-b pb-3'>
              <div>
                <p className='font-semibold'>{selected.name}</p>
                <p className='text-muted-foreground text-xs'>
                  {selected.company}
                  {selected.orgNumber !== '—' ? ` · Org.nr ${selected.orgNumber}` : ''} ·{' '}
                  {selected.phone}
                </p>
              </div>
              <div className='text-right'>
                <Badge
                  variant='outline'
                  className={cn(CALL_TYPE_META[selected.callType].className)}
                >
                  {CALL_TYPE_META[selected.callType].label}
                </Badge>
                <p className='text-muted-foreground mt-1 text-[10px] font-mono'>
                  call-id: {selected.callId}
                </p>
              </div>
            </div>

            <div className='bg-muted rounded-lg p-3'>
              <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>
                Sammanfattning (n8n)
              </p>
              <p className='text-sm'>{selected.summary}</p>
            </div>

            <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto'>
              <p className='text-muted-foreground text-xs font-medium uppercase'>
                Transkript
              </p>
              {selected.transcript.length > 0 ? (
                selected.transcript.map((turn, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      turn.speaker === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                        turn.speaker === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {turn.text}
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-muted-foreground text-sm'>
                  Inget transkript — samtalet besvarades aldrig.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className='text-muted-foreground text-sm'>Välj ett samtal i listan.</p>
        )}
      </Card>
    </div>
  );
}
