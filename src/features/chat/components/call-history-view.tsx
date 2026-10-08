'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// MOCK — samtalshistorik förhandsvisning. Wiring pass: swap for
// useQuery(campaignCallOptions(...)) + /api/calls — the ?callId=[ID] deep
// links select that call directly.

interface HistoryCall {
  id: string;
  callId: string;
  name: string;
  company: string;
  phone: string;
  date: string;
  duration: string;
  outcome: string;
  summary: string;
  transcript: { speaker: 'user' | 'agent'; text: string }[];
}

const MOCK_CALLS: HistoryCall[] = [
  {
    id: '1',
    callId: 'uv-call-8f3a2b1c',
    name: 'Anna Andersson',
    company: 'Acme AB',
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
    callId: 'uv-call-9d4e3f2a',
    name: 'Erik Svensson',
    company: 'Nordica AB',
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
    id: '3',
    callId: 'uv-call-7c2d1e9b',
    name: 'Maria Larsson',
    company: 'Bergström & Co',
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
  },
  {
    id: '4',
    callId: 'uv-call-6b1a0d8c',
    name: 'Peter Ek',
    company: 'Nordica AB',
    phone: '+46 70 333 44 55',
    date: 'igår 10:30',
    duration: '0 min 22 s',
    outcome: 'Ej svar',
    summary: 'Inget svar efter tre försök — kontakten pausad enligt max-gränsen.',
    transcript: []
  },
  {
    id: '5',
    callId: 'uv-call-5a9f8c7d',
    name: 'Lisa Berg',
    company: 'Bergström & Co',
    phone: '+46 76 222 33 44',
    date: '12 maj 14:22',
    duration: '3 min 05 s',
    outcome: 'Nej tack',
    summary: 'Lisa tackade nej — ingen aktuell budget i år. Följ upp nästa kvartal.',
    transcript: [
      { speaker: 'agent', text: 'Hej Lisa! Har ni behov av AI-röstsamtal för er kundlista?' },
      { speaker: 'user', text: 'Nej tack, inte i år — budgeten är låst.' }
    ]
  }
];

/**
 * Samtalshistorik — list of calls (namn, företag, telefon, call-id,
 * sammanfattning) with the detail view (summary + transcript bubbles).
 */
export function CallHistoryView() {
  const [search, setSearch] = React.useState('');
  const [selectedId, setSelectedId] = React.useState(MOCK_CALLS[0]?.id ?? '');

  const filtered = MOCK_CALLS.filter(
    (call) =>
      call.name.toLowerCase().includes(search.toLowerCase()) ||
      call.company.toLowerCase().includes(search.toLowerCase())
  );
  const selected =
    MOCK_CALLS.find((call) => call.id === selectedId) ?? filtered[0];

  return (
    <div className='grid min-h-0 flex-1 gap-4 lg:grid-cols-[380px_1fr]'>
      {/* Call list */}
      <Card className='flex flex-col gap-3 rounded-2xl p-3'>
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
          {filtered.map((call) => (
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
              <p className='text-muted-foreground text-xs'>{call.company}</p>
              <p className='text-muted-foreground line-clamp-1 text-xs'>{call.summary}</p>
              <div className='flex flex-wrap gap-1'>
                <Badge variant='outline' className='h-5 rounded-sm px-1.5 text-[10px]'>
                  {call.outcome}
                </Badge>
                <Badge variant='secondary' className='h-5 rounded-sm px-1.5 text-[10px]'>
                  {call.duration}
                </Badge>
              </div>
            </button>
          ))}
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
                  {selected.company} · {selected.phone}
                </p>
              </div>
              <div className='text-right'>
                <Badge>{selected.outcome}</Badge>
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
