'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { getQueryClient } from '@/lib/query-client';
import * as React from 'react';
import { updateCampaignMutation } from '../api/mutations';
import type { Campaign, CampaignUpdatePayload } from '../api/types';
import {
  SchedulingControls,
  toIsoDateTime,
  type SchedulingValue
} from './scheduling-controls';

interface ResumeCampaignDialogProps {
  campaign: Campaign | null;
  onClose: () => void;
}

/**
 * Återuppta kampanj — an auto-ended campaign (the window ran out) gets a new
 * window: SAME campaign, SAME prospects. The contact's attempt counter
 * continues, max_försök stays terminal (anti-spam). PATCH live + the new
 * window re-dispatches start.batch.campaign → n8n dials the remaining i_ko
 * prospects in the new window.
 */
export function ResumeCampaignDialog({ campaign, onClose }: ResumeCampaignDialogProps) {
  const [scheduling, setScheduling] = React.useState<SchedulingValue>(() => ({
    date: new Date(new Date().setHours(0, 0, 0, 0)),
    start: '08:00',
    end: '17:00'
  }));

  const { data: tenantData } = useQuery({
    queryKey: ['tenant'] as const,
    queryFn: () => apiClient<{ evenings: boolean }>('/tenant'),
    staleTime: 60_000
  });
  const evenings = tenantData?.evenings ?? false;

  const mutation = useMutation({
    ...updateCampaignMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ['campaigns'] as const });
      toast.success('Kampanjen återupptas — prospekten köas i det nya fönstret');
      onClose();
    },
    onError: () => toast.error('Kunde inte återuppta kampanjen. Försök igen.')
  });

  return (
    <Dialog open={!!campaign} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Återuppta {campaign?.name ?? 'kampanj'}</DialogTitle>
          <DialogDescription>
            Välj ett nytt ringfönster — kampanjen ringer kvarvarande prospekten.
            Försöksräknaren fortsätter och max_försök-prospekt hoppar över.
          </DialogDescription>
        </DialogHeader>

        <SchedulingControls value={scheduling} onChange={setScheduling} evenings={evenings} />

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Avbryt
          </Button>
          <Button
            disabled={!scheduling.date || mutation.isPending}
            onClick={() =>
              campaign &&
              mutation.mutate({
                id: campaign.id,
                values: {
                  status: 'live',
                  scheduled_start: toIsoDateTime(scheduling.date, scheduling.start),
                  scheduled_end: toIsoDateTime(scheduling.date, scheduling.end)
                } as CampaignUpdatePayload
              })
            }
          >
            Återuppta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}