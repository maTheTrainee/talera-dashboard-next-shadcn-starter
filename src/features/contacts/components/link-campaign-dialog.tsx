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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ApiError, apiClient } from '@/lib/api-client';
import { getQueryClient } from '@/lib/query-client';
import * as React from 'react';
import { campaignsQueryOptions } from '@/features/campaigns/api/queries';
import { createCampaign } from '@/features/campaigns/api/service';
import {
  SchedulingControls,
  toIsoDateTime,
  type SchedulingValue
} from '@/features/campaigns/components/scheduling-controls';
import { linkContactsToCampaign } from '../api/service';
import type { Contact } from '../api/types';

interface LinkCampaignDialogProps {
  open: boolean;
  contacts: Contact[];
  onClose: () => void;
}

/** Invaliderar båda listorna — kontakter (Kampanj-kolumnen) + kampanjer (räknare). */
function invalidateLists() {
  getQueryClient().invalidateQueries({ queryKey: ['contacts'] as const });
  getQueryClient().invalidateQueries({ queryKey: ['campaigns'] as const });
}

/**
 * Lägg i kampanj — markerade kontakter (utan befintlig kampanj) hamnar i
 * antingen en befintlig kampanj (köad/pausad/live) eller en NY kampanj som
 * skapas direkt av urvalet (namn + schemaläggning). En kontakt ligger i
 * max en kampanj — checkboxar för redan-kopplade kontakter är avstängda.
 */
export function LinkCampaignDialog({ open, contacts, onClose }: LinkCampaignDialogProps) {
  const [mode, setMode] = React.useState<'existing' | 'new'>('existing');
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [scheduling, setScheduling] = React.useState<SchedulingValue>(() => ({
    date: new Date(new Date().setHours(0, 0, 0, 0)),
    start: '08:00',
    end: '17:00'
  }));

  // Ny öppning → återställ valen.
  React.useEffect(() => {
    if (open) {
      setMode('existing');
      setCampaignId(null);
      setName('');
      setScheduling({
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        start: '08:00',
        end: '17:00'
      });
    }
  }, [open]);

  const { data: campaignsData } = useQuery({
    ...campaignsQueryOptions({ limit: 50 }),
    enabled: open
  });
  // Avslutade kampanjer tar inte emot nya prospekter — dolda ur väljaren.
  const campaignOptions = React.useMemo(
    () =>
      (campaignsData?.items ?? [])
        .filter((c) => c.status !== 'avslutad')
        .sort((a, b) => a.name.localeCompare(b.name, 'sv')),
    [campaignsData]
  );

  const { data: tenantData } = useQuery({
    queryKey: ['tenant'] as const,
    queryFn: () => apiClient<{ evenings: boolean }>('/tenant'),
    staleTime: 60_000
  });
  const evenings = tenantData?.evenings ?? false;

  const linkMutation = useMutation({
    mutationFn: ({
      contactIds,
      campaignId: targetId
    }: {
      contactIds: string[];
      campaignId: string;
    }) => linkContactsToCampaign(contactIds, targetId),
    onSuccess: (result, variables) => {
      invalidateLists();
      const target = campaignOptions.find((c) => c.id === variables.campaignId);
      toast.success(
        `${result.linked} ${result.linked === 1 ? 'kontakt lagd' : 'kontakter lagda'} i kampanjen "${target?.name ?? 'kampanjen'}"${result.skipped > 0 ? `, ${result.skipped} hoppades över` : ''}`
      );
      onClose();
    },
    onError: (error) => toast.error(error.message)
  });

  const createAndLinkMutation = useMutation({
    mutationFn: async () => {
      // Skapa kampanjen först (samma flöde som Kampanjguiden), länka
      // markeringen därefter — kampanjen föds med prospekten på plats.
      const campaign = await createCampaign({
        name: name.trim(),
        description: '',
        scheduled_start: toIsoDateTime(scheduling.date, scheduling.start),
        scheduled_end: toIsoDateTime(scheduling.date, scheduling.end),
        outbound_number: null,
        max_attempts: 3
      });
      const result = await linkContactsToCampaign(
        contacts.map((c) => c.id),
        campaign.id
      );
      return { campaign, result };
    },
    onSuccess: ({ campaign, result }) => {
      invalidateLists();
      toast.success(
        `Kampanjen "${campaign.name}" skapad med ${result.linked} ${result.linked === 1 ? 'prospekt' : 'prospekter'}`
      );
      onClose();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Kunde inte skapa kampanjen. Försök igen.'
      );
    }
  });

  const isPending = linkMutation.isPending || createAndLinkMutation.isPending;
  const canSubmit =
    mode === 'existing' ? !!campaignId : name.trim().length > 0 && !!scheduling.date;

  const submit = () => {
    if (mode === 'existing' && campaignId) {
      linkMutation.mutate({
        contactIds: contacts.map((c) => c.id),
        campaignId
      });
      return;
    }
    if (mode === 'new' && name.trim()) {
      createAndLinkMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Lägg i kampanj</DialogTitle>
          <DialogDescription>
            {contacts.length} {contacts.length === 1 ? 'kontakt markerad' : 'kontakter markerade'} —
            lägg dem i en befintlig kampanj eller skapa en ny av dem.
          </DialogDescription>
        </DialogHeader>

        <div className='flex gap-2'>
          <Button
            type='button'
            variant={mode === 'existing' ? 'default' : 'outline'}
            size='sm'
            className='flex-1'
            onClick={() => setMode('existing')}
          >
            Befintlig kampanj
          </Button>
          <Button
            type='button'
            variant={mode === 'new' ? 'default' : 'outline'}
            size='sm'
            className='flex-1'
            onClick={() => setMode('new')}
          >
            Skapa ny kampanj
          </Button>
        </div>

        {mode === 'existing' ? (
          <div className='space-y-1.5'>
            <Label>Välj kampanj</Label>
            <Select
              value={campaignId ?? undefined}
              onValueChange={(v) => {
                if (v) setCampaignId(v);
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Välj kampanj' />
              </SelectTrigger>
              <SelectContent>
                {campaignOptions.length === 0 ? (
                  <div className='text-muted-foreground px-3 py-2 text-sm'>
                    Inga aktiva kampanjer.
                  </div>
                ) : (
                  campaignOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='link-campaign-name'>Kampanjnamn</Label>
              <Input
                id='link-campaign-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='T.ex. Q1 Försäljning'
              />
            </div>
            <SchedulingControls value={scheduling} onChange={setScheduling} evenings={evenings} />
          </div>
        )}

        <p className='text-muted-foreground text-xs'>
          Kontakterna flyttas till kampanjen och hamnar i ringkön (status: I kö).
        </p>

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Avbryt
          </Button>
          <Button disabled={!canSubmit || isPending} onClick={submit}>
            {isPending
              ? 'Sparar…'
              : mode === 'existing'
                ? 'Lägg i kampanj'
                : 'Skapa kampanj & lägg i'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
