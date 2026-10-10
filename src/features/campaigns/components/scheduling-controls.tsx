'use client';

import * as React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FieldDescription } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// 24-timmars tidsalternativ 08:00–19:00 i 30-min-steg — VI renderar
// alternativen själva, så webbläsarens språk kan aldrig göra om dem till AM/PM.
function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let m = 8 * 60; m <= 19 * 60; m += 30) {
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    options.push(`${h}:${mm}`);
  }
  return options;
}
const TIME_OPTIONS = buildTimeOptions();
const STANDARD_END_MINUTES = 17 * 60; // utan kvälls-tillvalet slutar väljaren på 17:00

export interface SchedulingValue {
  date: Date | undefined;
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
}

interface SchedulingControlsProps {
  value: SchedulingValue;
  onChange: (value: SchedulingValue) => void;
  /** Per-tenant-tillval (option B): kvällsringning t.o.m. 19:00. */
  evenings: boolean;
  error?: string;
}

const PRESETS = [
  {
    key: 'formiddag',
    label: 'Förmiddag',
    hint: '08:00–12:00',
    start: '08:00',
    end: '12:00'
  },
  {
    key: 'eftermiddag',
    label: 'Eftermiddag',
    hint: '13:00–17:00',
    start: '13:00',
    end: '17:00'
  },
  {
    key: 'heldag',
    label: 'Heldag',
    hint: '08:00–17:00',
    start: '08:00',
    end: '17:00'
  }
];

/**
 * Datumväljare + förinställda fönster + 24-timmars tidsselects. Återanvänds
 * av Kampanjguiden (steg 2) och Återuppta-dialogen — konsekvent UX.
 *
 * - Heldag 08:00–17:00 är standardförslaget
 * - Kväll (t.o.m. 19:00) är gråad utan `evenings`-tillvalet — en synlig
 *   uppsäljning, aldrig bortglömd
 * - ISO-strängen byggs deterministiskt av tre kontrollerade värden —
 *   valideringen kan aldrig feltolka (inga AM/PM-, DST- eller locale-buggar)
 */
export function SchedulingControls({
  value,
  onChange,
  evenings,
  error
}: SchedulingControlsProps) {
  const dateStr = value.date
    ? `${value.date.getFullYear()}-${String(value.date.getMonth() + 1).padStart(2, '0')}-${String(value.date.getDate()).padStart(2, '0')}`
    : undefined;

  const timeOptions = TIME_OPTIONS.filter((t) => {
    const minutes = Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    return minutes <= (evenings ? 19 * 60 : STANDARD_END_MINUTES);
  });

  return (
    <div className='space-y-3'>
      <FieldDescription>
        Kampanjen avslutas automatiskt när tiden rinner ut — kvarvarande
        prospekter sparas och kan återupptas med ett nytt fönster.
      </FieldDescription>

      <div className='flex flex-wrap items-center gap-2'>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type='button'
                variant='outline'
                size='sm'
                className={cn(!value.date && 'text-muted-foreground')}
              />
            }
          >
            <Icons.calendar className='mr-1 h-3.5 w-3.5' />
            {dateStr ?? 'Välj datum'}
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={value.date}
              onSelect={(d) => onChange({ ...value, date: d })}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </PopoverContent>
        </Popover>

        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            type='button'
            variant='outline'
            size='sm'
            className={cn(
              value.start === preset.start &&
                value.end === preset.end &&
                'border-primary/60 bg-primary/10'
            )}
            onClick={() => onChange({ ...value, start: preset.start, end: preset.end })}
          >
            {preset.label}
            <span className='text-muted-foreground ml-1'>{preset.hint}</span>
          </Button>
        ))}

        {/* Kväll — per-tenant-tillval: synlig men gråad utan evenings */}
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!evenings}
          title={
            evenings
              ? undefined
              : 'Kvällsringning ingår inte i ert avtal — kontakta Talera'
          }
          className={cn(
            !evenings && 'cursor-not-allowed opacity-50',
            evenings &&
              value.start === '17:00' &&
              value.end === '19:00' &&
              'border-primary/60 bg-primary/10'
          )}
          onClick={() => onChange({ ...value, start: '17:00', end: '19:00' })}
        >
          {!evenings && <Icons.lock className='mr-1 h-3 w-3' />}
          Kväll
          <span className='text-muted-foreground ml-1'>t.o.m. 19:00</span>
        </Button>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label>Starttid</Label>
          <Select
            value={value.start || undefined}
            onValueChange={(v) => {
              if (v) onChange({ ...value, start: v });
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Välj starttid' />
            </SelectTrigger>
            <SelectContent className='max-h-64'>
              {timeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-1.5'>
          <Label>Sluttid</Label>
          <Select
            value={value.end || undefined}
            onValueChange={(v) => {
              if (v) onChange({ ...value, end: v });
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Välj sluttid' />
            </SelectTrigger>
            <SelectContent className='max-h-64'>
              {timeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className='text-destructive text-sm'>{error}</p>}
    </div>
  );
}

/** Bygger ISO-strängen (YYYY-MM-DDTHH:mm) deterministiskt. */
export function toIsoDateTime(date: Date | undefined, time: string): string {
  if (!date || !time) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${time}`;
}