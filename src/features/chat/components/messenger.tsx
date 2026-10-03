'use client';

import { useCallback, useState } from 'react';
import { useTranscriptStore } from '../utils/store';
import type { CallTranscript } from '../utils/types';
import { TranscriptList } from './transcript-list';
import { TranscriptView } from './transcript-view';

export function TranscriptPanel() {
  const { transcripts, selectedTranscriptId, selectTranscript, getActiveTranscript } =
    useTranscriptStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTranscripts = transcripts.filter(
    (t) =>
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phoneNumber.includes(searchQuery)
  );

  const activeTranscript = getActiveTranscript();

  return (
    <div className='border-border/50 bg-background/70 relative grid h-[calc(100dvh-5.5rem)] w-full grid-rows-[auto,1fr] gap-3 overflow-hidden rounded-2xl border p-3 backdrop-blur-xl sm:gap-4 sm:p-4 lg:[grid-template-columns:30%_1fr] lg:grid-rows-[1fr] lg:gap-4 lg:rounded-3xl lg:p-5'>
      <div className='flex flex-col gap-3'>
        <div className='relative'>
          <input
            type='text'
            placeholder='Sök transkriptioner...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full px-3 py-2 pl-10 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring'
          />
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </span>
        </div>
        <TranscriptList
          transcripts={filteredTranscripts}
          selectedId={selectedTranscriptId}
          onSelect={selectTranscript}
        />
      </div>
      {activeTranscript ? (
        <TranscriptView transcript={activeTranscript} />
      ) : (
        <div className='flex items-center justify-center h-full text-muted-foreground'>
          Välj ett samtal för att visa transkription
        </div>
      )}
    </div>
  );
}
