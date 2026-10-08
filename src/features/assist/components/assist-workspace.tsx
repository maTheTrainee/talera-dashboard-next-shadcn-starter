'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { createUVSession, UVSession, UVSessionStatus } from '../uv-client';

type AssistState = 'idle' | 'connecting' | 'live' | 'error';

/**
 * Ring AI-Assistent — the textless browser audio workspace. Mobile-first,
 * full-height centered layout with one large microphone call button; the
 * session token is fetched from our secure proxy route
 * (POST /api/assist/uv-session) and the uv session is initialized with ONLY
 * that single-use joinUrl.
 */
export function AssistWorkspace() {
  const [state, setState] = React.useState<AssistState>('idle');
  const [statusLabel, setStatusLabel] = React.useState('');
  const sessionRef = React.useRef<UVSession | null>(null);

  const endCall = React.useCallback(async () => {
    await sessionRef.current?.leaveCall();
    sessionRef.current = null;
    setState('idle');
    setStatusLabel('');
  }, []);

  const startCall = React.useCallback(async () => {
    setState('connecting');
    setStatusLabel('Kopplar upp');
    try {
      const res = await fetch('/api/assist/uv-session', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Kunde inte starta sessionen.');
      }
      const { uvSessionToken } = (await res.json()) as { uvSessionToken: string };

      const session = createUVSession();
      session.addEventListener('status', () => {
        const s = session.status;
        setStatusLabel(s);
        if (
          s === UVSessionStatus.LISTENING ||
          s === UVSessionStatus.SPEAKING ||
          s === UVSessionStatus.THINKING
        ) {
          setState('live');
        }
        if (s === UVSessionStatus.DISCONNECTED) {
          sessionRef.current = null;
          setState('idle');
          setStatusLabel('');
        }
      });
      session.joinCall(uvSessionToken);
      sessionRef.current = session;
    } catch (err) {
      setState('error');
      setStatusLabel(err instanceof Error ? err.message : 'Okänt fel.');
    }
  }, []);

  const isLive = state === 'live';
  const isBusy = state === 'connecting';

  return (
    <div className='flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center gap-10 px-4 py-10 md:min-h-[calc(100dvh-16rem)]'>
      <div className='text-center'>
        <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
          Ring AI-Assistent
        </h2>
        <p className='text-muted-foreground mx-auto mt-3 max-w-md text-sm md:text-base'>
          {isLive
            ? 'Samtalet är igång — tala fritt.'
            : isBusy
              ? 'Kopplar upp en säker röstkanal…'
              : 'Din AI-assistent är redo — tryck på knappen så ringer du direkt. Samtalet sker helt med röst.'}
        </p>
      </div>

      <div className='relative'>
        {isLive && (
          <span
            className='bg-destructive/40 absolute inset-0 animate-ping rounded-full'
            aria-hidden='true'
          />
        )}
        <Button
          onClick={() => (isLive ? void endCall() : void startCall())}
          disabled={isBusy}
          className={cn(
            'relative size-32 rounded-full shadow-xl transition-transform active:scale-95 md:size-40',
            isLive && 'bg-destructive hover:bg-destructive'
          )}
          aria-label={isLive ? 'Avsluta samtal' : 'Starta samtal'}
        >
          {isBusy ? (
            <Icons.spinner className='size-10 animate-spin md:size-12' />
          ) : isLive ? (
            <Icons.phone className='size-10 md:size-12' />
          ) : (
            <Icons.mic className='size-12 md:size-14' />
          )}
        </Button>
      </div>

      {statusLabel && (
        <Badge
          variant={state === 'error' ? 'destructive' : 'secondary'}
          className='capitalize'
        >
          {state === 'error' ? statusLabel : `Status: ${statusLabel}`}
        </Badge>
      )}
    </div>
  );
}
