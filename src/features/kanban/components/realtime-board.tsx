'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { ProspectStatus } from '../../campaigns/api/types';

// MOCK — visual preview of the system-driven board. Wiring pass: swap the
// mock for useQuery(contactsQueryOptions({ limit: 200, sort: '-updated' }),
// { refetchInterval: 10_000 }) — the SYSTEM (n8n) moves the cards by writing
// contact statuses; users never drag.

interface BoardContact {
  id: string;
  name: string;
  company: string;
  orgNumber: string;
  phone: string;
  campaign: string;
  attempts: number;
  max: number;
}

const BOARD_COLUMNS: { key: ProspectStatus; label: string }[] = [
  { key: 'i_ko', label: 'I kö' },
  { key: 'ringer', label: 'Ringer' },
  { key: 'i_samtal', label: 'I samtal' },
  { key: 'avslutat', label: 'Avslutat' }
];

const MOCK_CONTACTS: Record<string, BoardContact[]> = {
  i_ko: [
    { id: '1', name: 'Anna Andersson', company: 'Acme AB', orgNumber: '556123-4567', phone: '+46 70 123 45 67', campaign: 'Q1 Försäljning', attempts: 1, max: 3 },
    { id: '2', name: 'Erik Svensson', company: 'Nordica AB', orgNumber: '556987-1234', phone: '+46 73 987 65 43', campaign: 'Q1 Försäljning', attempts: 2, max: 3 },
    { id: '3', name: 'Maria Larsson', company: 'Bergström & Co', orgNumber: '556456-7890', phone: '+46 76 111 22 33', campaign: 'Vinterkampanj', attempts: 0, max: 3 }
  ],
  ringer: [
    { id: '4', name: 'Johan Nilsson', company: 'Acme AB', orgNumber: '556123-4567', phone: '+46 70 456 78 90', campaign: 'Q1 Försäljning', attempts: 2, max: 3 }
  ],
  i_samtal: [
    { id: '5', name: 'Sara Lindberg', company: 'Fjällbacka Handel', orgNumber: '556321-6543', phone: '+46 76 998 87 76', campaign: 'Vinterkampanj', attempts: 1, max: 3 }
  ],
  avslutat: [
    { id: '6', name: 'Peter Ek', company: 'Nordica AB', orgNumber: '556987-1234', phone: '+46 70 333 44 55', campaign: 'Q1 Försäljning', attempts: 3, max: 3 },
    { id: '7', name: 'Lisa Berg', company: 'Bergström & Co', orgNumber: '556456-7890', phone: '+46 76 222 33 44', campaign: 'Vinterkampanj', attempts: 1, max: 3 }
  ]
};

/**
 * Realtidsvy — the system-driven board for live voice cycles
 * (I kö → Ringer → I samtal → Avslutat). Read-only: cards move automatically
 * as n8n writes contact statuses — never by dragging.
 */
export function RealtimeBoard() {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Badge variant='secondary' className='gap-1.5'>
          <Icons.spinner className='size-3 animate-spin' />
          Uppdateras automatiskt
        </Badge>
      </div>
      <div className='grid w-full grid-cols-1 gap-4 overflow-x-auto rounded-md pb-4 md:grid-cols-4'>
        {BOARD_COLUMNS.map((column) => {
          const contacts = MOCK_CONTACTS[column.key] ?? [];
          return (
            <div
              key={column.key}
              className='bg-muted/40 w-full shrink-0 rounded-lg border p-2 md:w-auto'
            >
              <div className='flex items-center justify-between px-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-semibold'>{column.label}</span>
                  <Badge variant='secondary' className='pointer-events-none rounded-sm'>
                    {contacts.length}
                  </Badge>
                </div>
              </div>
              <div className='flex flex-col gap-2 p-0.5'>
                {contacts.map((contact) => (
                  <div key={contact.id} className='bg-card rounded-md border p-3 shadow-xs'>
                    <div className='flex flex-col gap-1.5'>
                      <span className='line-clamp-1 text-sm font-medium'>{contact.name}</span>
                      <span className='text-muted-foreground line-clamp-1 text-xs'>
                        {contact.company} · {contact.orgNumber}
                      </span>
                      <div className='text-muted-foreground flex items-center justify-between text-xs'>
                        <span className='line-clamp-1'>{contact.phone}</span>
                        <span className='tabular-nums'>
                          {contact.max > 0
                            ? `${contact.attempts}/${contact.max}`
                            : contact.attempts}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}