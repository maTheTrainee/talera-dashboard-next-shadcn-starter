'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

// MOCK — visual preview. Wiring pass: the dialog receives the real contact +
// latest call (from /api/contacts + /api/calls/[callId]) instead of mock data.

export interface ProspectPreview {
  name: string;
  company: string;
  orgNumber?: string;
  phone: string;
  status: string;
  followUpAt?: string;
  attempts: number;
  max: number;
  lastSummary?: string;
  lastTranscript?: { text: string; speaker: 'user' | 'agent' }[];
}

interface ProspectDialogProps {
  open: boolean;
  onClose: () => void;
  prospect?: ProspectPreview;
}

const STATUS_LABELS: Record<string, string> = {
  ny: 'Ny',
  i_ko: 'I kö',
  ringer: 'Ringer',
  i_samtal: 'I samtal',
  avslutat: 'Avslutat',
  ej_svar: 'Ej svar',
  'uppföljning': 'Uppföljning',
  'max_försök': 'Max försök'
};

/**
 * Prospect popup — temporary detail view of either the contact card or the
 * call history for one prospect. Reached from the events feed (and reusable
 * from the cockpit / real contact lists at wiring time).
 */
export function ProspectDialog({ open, onClose, prospect }: ProspectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{prospect?.name ?? 'Prospekt'}</DialogTitle>
          <DialogDescription>
            {prospect?.company ? `${prospect.company}` : ''}
            {prospect?.orgNumber ? ` · Org.nr ${prospect.orgNumber}` : ''}
            {prospect?.phone ? ` · ${prospect.phone}` : ''}
          </DialogDescription>
        </DialogHeader>

        {prospect && (
          <div className='space-y-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary' className='capitalize'>
                {STATUS_LABELS[prospect.status] ?? prospect.status}
              </Badge>
              <Badge variant='outline'>
                Kontaktförsök:{' '}
                {prospect.max > 0
                  ? `${prospect.attempts}/${prospect.max}`
                  : prospect.attempts}
              </Badge>
              {prospect.followUpAt && (
                <Badge variant='outline'>Uppföljning: {prospect.followUpAt}</Badge>
              )}
            </div>

            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>
                Samtalshistorik
              </p>
              {prospect.lastSummary ? (
                <div className='mt-2 space-y-3'>
                  <p className='bg-muted rounded-lg p-3 text-sm'>{prospect.lastSummary}</p>
                  {prospect.lastTranscript?.map((turn, i) => (
                    <div
                      key={i}
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
                  ))}
                </div>
              ) : (
                <p className='text-muted-foreground mt-2 text-sm'>
                  Inga samtal registrerade än.
                </p>
              )}
            </div>

            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={onClose}>
                <Icons.close className='mr-2 h-4 w-4' /> Stäng
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}