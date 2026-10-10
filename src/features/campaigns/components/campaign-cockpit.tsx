'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import {
  campaignCallOptions,
  campaignDetailOptions,
  campaignProspectsOptions
} from '../api/queries';
import { updateCampaignMutation } from '../api/mutations';
import { ApiError } from '@/lib/api-client';
import type { Campaign, CampaignProspect } from '../api/types';

interface CampaignCockpitProps {
  campaignId: string;
}

/**
 * The nested campaign deep-dive cockpit: master campaign states (Köad / Live /
 * Pausad) alongside a relational data grid pulling from the contacts (prospects)
 * table — every prospect locked into the campaign, their call outcomes, and the
 * integrated Chat Transcript popup modal, all synced with the main collections.
 */
export function CampaignCockpit({ campaignId }: CampaignCockpitProps) {
  // useQuery (inte useSuspenseQuery): SSR-fetch kan aldrig bära Clerk-
  // sessionen — den körs endast i klienten, servern skelettar direkt.
  const { data: campaign, isPending } = useQuery(campaignDetailOptions(campaignId));
  const [transcriptCallId, setTranscriptCallId] = React.useState<string | null>(null);

  const statusMutation = useMutation({
    ...updateCampaignMutation,
    onSuccess: () => toast.success('Kampanjstatus uppdaterad'),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'Kunde inte uppdatera kampanjstatus')
  });

  const states: { key: string; label: string; description: string }[] = [
    { key: 'köad', label: 'Köad', description: 'Väntar på schemalagd start.' },
    { key: 'live', label: 'Live', description: 'Samtalen körs enligt schema.' },
    { key: 'pausad', label: 'Pausad', description: 'Pausad — återuppta när som helst.' }
  ];

  if (isPending || !campaign) return <CampaignCockpitSkeleton />;

  return (
    <div className='space-y-4'>
      {/* Kampanjens identitet — namn + status + schemalagt fönster, alltid synligt */}
      <div className='flex flex-wrap items-center gap-2'>
        <h2 className='text-xl font-semibold tracking-tight'>{campaign.name}</h2>
        <Badge
          variant={
            campaign.status === 'live'
              ? 'default'
              : campaign.status === 'pausad'
                ? 'secondary'
                : 'outline'
          }
          className='capitalize'
        >
          {campaign.status}
        </Badge>
        <span className='text-muted-foreground text-sm'>
          {new Date(campaign.scheduled_start).toLocaleString('sv-SE', {
            dateStyle: 'short',
            timeStyle: 'short'
          })}{' '}
          →{' '}
          {new Date(campaign.scheduled_end).toLocaleString('sv-SE', {
            dateStyle: 'short',
            timeStyle: 'short'
          })}
        </span>
      </div>

      {/* Master campaign states — klicka kortet ELLER knappen för att byta status */}
      <div className='grid gap-4 md:grid-cols-3'>
        {states.map((state) => {
          const active = campaign.status === state.key;
          // Handlingsetiketten beror på nuvarande status: från köad heter
          // Live-kortets knapp "Starta", från pausad "Återuppta".
          const actionLabel =
            state.key === 'live'
              ? campaign.status === 'pausad'
                ? 'Återuppta'
                : 'Starta'
              : state.key === 'pausad'
                ? 'Pausa'
                : 'Sätt i kö';
          return (
            <Card
              key={state.key}
              className={cn(
                'transition-shadow',
                active ? 'ring-primary shadow-md ring-2' : 'cursor-pointer hover:shadow-md'
              )}
              onClick={() =>
                !active &&
                statusMutation.mutate({
                  id: campaign.id,
                  values: { status: state.key as Campaign['status'] }
                })
              }
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>{state.label}</CardTitle>
                  {active && <Badge>Aktuell</Badge>}
                </div>
                <CardDescription>{state.description}</CardDescription>
                {!active && (
                  <Button
                    size='sm'
                    variant={state.key === 'live' ? 'default' : 'outline'}
                    disabled={statusMutation.isPending}
                    onClick={(event) => {
                      event.stopPropagation();
                      statusMutation.mutate({
                        id: campaign.id,
                        values: { status: state.key as Campaign['status'] }
                      });
                    }}
                  >
                    {statusMutation.isPending ? 'Sparar…' : actionLabel}
                  </Button>
                )}
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue='prospekter'>
        <TabsList>
          <TabsTrigger value='prospekter'>Prospekter</TabsTrigger>
          <TabsTrigger value='detaljer'>Detaljer</TabsTrigger>
        </TabsList>

        <TabsContent value='prospekter' className='mt-4'>
          <ProspectsGrid campaign={campaign} onOpenTranscript={setTranscriptCallId} />
        </TabsContent>

        <TabsContent value='detaljer' className='mt-4'>
          <Card>
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription>{campaign.description}</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-3 text-sm md:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-xs uppercase'>Start</p>
                <p>{new Date(campaign.scheduled_start).toLocaleString('sv-SE')}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs uppercase'>Slut</p>
                <p>{new Date(campaign.scheduled_end).toLocaleString('sv-SE')}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs uppercase'>Utgående nummer</p>
                <p>{campaign.outbound_number}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs uppercase'>Max Kontaktförsök</p>
                <p>
                  {(campaign.max_attempts ?? 0) > 0
                    ? `${campaign.max_attempts} försök`
                    : 'Obegränsat'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TranscriptModal callId={transcriptCallId} onClose={() => setTranscriptCallId(null)} />
    </div>
  );
}

function ProspectsGrid({
  campaign,
  onOpenTranscript
}: {
  campaign: Campaign;
  onOpenTranscript: (callId: string) => void;
}) {
  const [page, setPage] = React.useState(1);
  // searchInput = fältets live-värde (skrivs direkt), search = den
  // debouncade frågevärdet som faktiskt hämtar.
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value);
  }, 400);

  const filters = {
    page,
    limit: PAGE_SIZE,
    ...(search && { search: search })
  };

  const { data, isPending, isError, refetch } = useQuery({
    ...campaignProspectsOptions(campaign.id, filters),
    placeholderData: (prev) => prev,
    // Alltid färsk data vid landning — en stale 30s-cache får aldrig visa
    // en tom lista när importen precis slutförts.
    refetchOnMount: 'always'
  });

  const total = data?.total_items ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            placeholder='Sök prospekt (namn eller nummer)...'
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSetSearch(e.target.value);
            }}
            className='max-w-xs'
          />
          <span className='text-muted-foreground text-xs'>
            {isPending ? 'Laddar prospekter…' : `${total} prospekt i kampanjen`}
          </span>
          {isError && (
            <Button variant='outline' size='sm' onClick={() => void refetch()}>
              <Icons.refresh className='mr-1 h-3.5 w-3.5' /> Försök igen
            </Button>
          )}
        </div>

        {isError ? (
          <div className='bg-destructive/5 border-destructive/20 mt-3 flex flex-col items-center justify-center rounded-lg border py-12'>
            <Icons.warning className='text-destructive/60 mb-2 h-8 w-8' />
            <p className='text-destructive text-sm font-medium'>Kunde inte hämta prospekten.</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Ett fel uppstod vid hämtningen — försök igen om en stund.
            </p>
          </div>
        ) : isPending ? (
          <div className='mt-3 space-y-2'>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className='bg-muted h-12 animate-pulse rounded-lg' />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <Icons.teams className='text-muted-foreground/40 mb-2 h-8 w-8' />
            <p className='text-muted-foreground text-sm'>
              {search
                ? 'Inga prospekter matchar sökningen.'
                : 'Inga prospekter i den här kampanjen än.'}
            </p>
          </div>
        ) : (
          <div className='mt-3 overflow-hidden rounded-lg border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/60'>
                <tr className='text-muted-foreground text-left text-[11px] uppercase'>
                  <th className='py-2.5 pr-4 pl-3 font-medium'>Kontakt</th>
                  <th className='py-2.5 pr-4 font-medium'>Telefon</th>
                  <th className='py-2.5 pr-4 font-medium'>Ringstatus</th>
                  <th className='py-2.5 pr-4 font-medium'>Sammanfattning</th>
                  <th className='py-2.5 pr-3 font-medium'>
                    <span className='sr-only'>Åtgärder</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((prospect) => (
                  <ProspectRow
                    key={prospect.id}
                    prospect={prospect}
                    onOpenTranscript={onOpenTranscript}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className='mt-3 flex items-center justify-between'>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {from}–{to} av {total} prospekter
            </span>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1 || isPending}
                onClick={() => setPage((p) => p - 1)}
              >
                <Icons.chevronLeft className='mr-1 h-3.5 w-3.5' /> Föregående
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={to >= total || isPending}
                onClick={() => setPage((p) => p + 1)}
              >
                Nästa <Icons.chevronRight className='ml-1 h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PAGE_SIZE = 25;

function ProspectRow({
  prospect,
  onOpenTranscript
}: {
  prospect: CampaignProspect;
  onOpenTranscript: (callId: string) => void;
}) {
  return (
    <tr className='hover:bg-muted/40 border-b last:border-0'>
      <td className='py-2.5 pr-4 pl-3'>
        <span className='font-medium'>
          {prospect.first_name} {prospect.last_name}
        </span>
        {prospect.company && (
          <span className='text-muted-foreground block text-xs'>{prospect.company}</span>
        )}
      </td>
      <td className='text-muted-foreground py-2.5 pr-4 tabular-nums'>{prospect.phone}</td>
      <td className='py-2.5 pr-4'>
        <Badge
          variant={
            prospect.status === 'avslutat' || prospect.status === 'i_samtal'
              ? 'default'
              : prospect.status === 'ringer' || prospect.status === 'uppföljning'
                ? 'secondary'
                : 'outline'
          }
          className='capitalize'
        >
          {prospect.status.replace('_', ' ')}
        </Badge>
      </td>
      <td className='text-muted-foreground line-clamp-2 max-w-[240px] py-2.5 pr-4'>
        {prospect.call_summary ?? 'Sammanfattningen skapas efter samtalet.'}
      </td>
      <td className='py-2.5 pr-3 text-right'>
        <Button
          variant='ghost'
          size='sm'
          disabled={!prospect.call_id}
          onClick={() => prospect.call_id && onOpenTranscript(prospect.call_id)}
        >
          <Icons.chat className='mr-2 h-4 w-4' /> Visa samtal
        </Button>
      </td>
    </tr>
  );
}

// --- Integrated Chat Transcript popup modal ---

function TranscriptModal({ callId, onClose }: { callId: string | null; onClose: () => void }) {
  const { data: call } = useQuery({
    ...campaignCallOptions(callId ?? ''),
    enabled: !!callId
  });

  return (
    <Dialog open={!!callId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Samtalstranskript</DialogTitle>
          <DialogDescription>
            {call?.summary ?? 'Sammanfattningen skapas efter samtalet.'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[400px] space-y-3 overflow-auto'>
          {call?.transcript?.length ? (
            call.transcript.map((turn, index) => (
              <div
                key={index}
                className={cn('flex', turn.speaker === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    turn.speaker === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {turn.text}
                </div>
              </div>
            ))
          ) : (
            <p className='text-muted-foreground text-sm'>
              Inga transkript ännu — de skapas efter varje samtal.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CampaignCockpitSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-3'>
        <Skeleton className='h-28 w-full rounded-lg' />
        <Skeleton className='h-28 w-full rounded-lg' />
        <Skeleton className='h-28 w-full rounded-lg' />
      </div>
      <Skeleton className='h-10 w-64 rounded' />
      <Skeleton className='h-96 w-full rounded-lg' />
    </div>
  );
}
