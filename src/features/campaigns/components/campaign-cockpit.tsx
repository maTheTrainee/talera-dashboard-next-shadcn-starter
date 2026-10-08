'use client';

import * as React from 'react';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { DataTable } from '@/components/ui/table/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import {
  campaignCallOptions,
  campaignDetailOptions,
  campaignProspectsOptions
} from '../api/queries';
import { updateCampaignMutation } from '../api/mutations';
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
  const { data: campaign } = useSuspenseQuery(campaignDetailOptions(campaignId));
  const [transcriptCallId, setTranscriptCallId] = React.useState<string | null>(null);

  const statusMutation = useMutation({
    ...updateCampaignMutation,
    onSuccess: () => toast.success('Kampanjstatus uppdaterad'),
    onError: () => toast.error('Kunde inte uppdatera kampanjstatus')
  });

  const states: { key: string; label: string; description: string }[] = [
    { key: 'köad', label: 'Köad', description: 'Väntar på schemalagd start.' },
    { key: 'live', label: 'Live', description: 'Batchen körs av automationen.' },
    { key: 'pausad', label: 'Pausad', description: 'Pausad — återuppta när som helst.' }
  ];

  return (
    <div className='space-y-4'>
      {/* Master campaign states — click a card to transition the campaign */}
      <div className='grid gap-4 md:grid-cols-3'>
        {states.map((state) => {
          const active = campaign.status === state.key;
          return (
            <Card
              key={state.key}
              className={cn(
                'transition-shadow',
                active
                  ? 'ring-primary shadow-md ring-2'
                  : 'cursor-pointer hover:shadow-md'
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

// --- Relational prospects grid ---

function getProspectColumns(
  campaign: Campaign,
  onOpenTranscript: (callId: string) => void
): ColumnDef<CampaignProspect>[] {
  return [
    {
      id: 'name',
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      header: 'Kontakt',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium'>
            {row.original.first_name} {row.original.last_name}
          </span>
          <span className='text-muted-foreground text-xs'>{row.original.email}</span>
        </div>
      )
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Telefon',
      cell: ({ row }) => (
        <a
          href={`tel:${row.original.phone}`}
          className='text-sm underline-offset-4 hover:underline'
        >
          {row.original.phone}
        </a>
      )
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Ringstatus',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className='flex flex-col'>
            <Badge variant='outline' className='w-fit capitalize'>
              {status.replace('_', ' ')}
            </Badge>
            {status === 'uppföljning' && row.original.follow_up_at && (
              <span className='text-muted-foreground text-xs'>
                {new Date(row.original.follow_up_at).toLocaleString('sv-SE', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'contact_attempts',
      accessorKey: 'contact_attempts',
      header: 'Kontaktförsök',
      cell: ({ row }) => {
        const attempts = row.original.contact_attempts ?? 0;
        const max = campaign.max_attempts ?? 0;
        return (
          <span className='text-muted-foreground text-sm'>
            {max > 0 ? `${attempts}/${max}` : attempts}
          </span>
        );
      }
    },
    {
      id: 'call_outcome',
      accessorKey: 'call_outcome',
      header: 'Utdata',
      cell: ({ cell }) => (
        <span className='text-muted-foreground text-sm'>
          {cell.getValue<CampaignProspect['call_outcome']>() ?? '—'}
        </span>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant='ghost'
          size='sm'
          disabled={!row.original.call_id}
          onClick={() => row.original.call_id && onOpenTranscript(row.original.call_id)}
        >
          <Icons.chat className='mr-2 h-4 w-4' /> Visa samtal
        </Button>
      )
    }
  ];
}

function ProspectsGrid({
  campaign,
  onOpenTranscript
}: {
  campaign: Campaign;
  onOpenTranscript: (callId: string) => void;
}) {
  const [search, setSearch] = React.useState('');
  const filters = { limit: 25, ...(search && { search }) };

  const { data } = useQuery({
    ...campaignProspectsOptions(campaign.id, filters),
    placeholderData: (prev) => prev
  });

  const columns = React.useMemo(
    () => getProspectColumns(campaign, onOpenTranscript),
    [campaign, onOpenTranscript]
  );

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.ceil((data?.total_items ?? 0) / 25),
    shallow: true
  });

  return (
    <DataTable table={table}>
      <div className='flex items-center gap-2 p-2'>
        <Input
          placeholder='Sök prospekt (namn eller nummer)...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-xs'
        />
        <span className='text-muted-foreground text-xs'>
          {data?.total_items ?? 0} prospekt i kampanjen
        </span>
      </div>
    </DataTable>
  );
}

// --- Integrated Chat Transcript popup modal ---

function TranscriptModal({
  callId,
  onClose
}: {
  callId: string | null;
  onClose: () => void;
}) {
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
            {call?.summary ?? 'Sammanfattning genereras av automationen efter samtalet.'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[400px] space-y-3 overflow-auto'>
          {call?.transcript?.length ? (
            call.transcript.map((turn, index) => (
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
              Inga transkript ännu — automationen skriver dem efter varje samtal.
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
