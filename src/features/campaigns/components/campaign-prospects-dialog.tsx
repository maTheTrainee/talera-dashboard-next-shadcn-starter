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
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { campaignProspectsOptions } from '../api/queries';

interface CampaignProspectsDialogProps {
  campaign: { id: string; name: string; status?: string } | null;
  onClose: () => void;
}

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, string> = {
  ny: 'Ny',
  i_ko: 'I kö',
  ringer: 'Ringer',
  i_samtal: 'I samtal',
  avslutat: 'Avslutat',
  ej_svar: 'Ej svar',
  uppföljning: 'Uppföljning',
  max_försök: 'Max försök'
};

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  return status === 'avslutat' || status === 'i_samtal'
    ? 'default'
    : status === 'ringer' || status === 'uppföljning'
      ? 'secondary'
      : 'outline';
}

/**
 * Kampanjprospekt-popup — "en popup av Kontakter-sidan" för den klickade
 * kampanjen: sticky rubrik med sökfält + räknare, tabell i appens stil med
 * sidnumrering, och sidfot med djuplänk till Kontakter. Drar från det
 * tenant-isolerade /api/campaigns/[campaignId]/prospects-routet.
 */
export function CampaignProspectsDialog({ campaign, onClose }: CampaignProspectsDialogProps) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setPage(1);
    setSearch(value);
  }, 400);

  // Ny kampanj → återställ sidnumrering + sökning.
  React.useEffect(() => {
    setPage(1);
    setSearch('');
  }, [campaign?.id]);

  const { data, isPending, isError, refetch } = useQuery({
    ...campaignProspectsOptions(campaign?.id ?? '', {
      page,
      limit: PAGE_SIZE,
      ...(search && { search })
    }),
    enabled: !!campaign
  });

  const total = data?.total_items ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <Dialog open={!!campaign} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl'>
        {/* Sticky rubrik: kampanj + status + sökning + räknare */}
        <div className='border-b px-6 pt-5 pb-4'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-lg'>
              {campaign?.name ?? 'Kampanj'}
              {campaign?.status && (
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
              )}
            </DialogTitle>
            <DialogDescription>
              Prospekter kopplade till kampanjen — samma vy som Kontakter.
            </DialogDescription>
          </DialogHeader>
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <label htmlFor='prospect-search' className='sr-only'>
              Sök prospekter
            </label>
            <Input
              id='prospect-search'
              value={search}
              onChange={(e) => debouncedSearch(e.target.value)}
              placeholder='Sök namn eller telefon...'
              className='h-8 w-full rounded-lg sm:w-64'
            />
            <span className='bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs'>
              {total} prospekter
            </span>
          </div>
        </div>

        {/* Tabell i appens stil */}
        <div className='max-h-[52vh] overflow-auto'>
          {isPending ? (
            <div className='space-y-2 px-6 py-4'>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className='bg-muted h-12 animate-pulse rounded-lg' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center justify-center py-14'>
              <Icons.warning className='text-destructive/60 mb-2 h-8 w-8' />
              <p className='text-destructive text-sm font-medium'>Kunde inte hämta prospekterna.</p>
              <Button variant='outline' size='sm' className='mt-3' onClick={() => void refetch()}>
                <Icons.refresh className='mr-1 h-3.5 w-3.5' /> Försök igen
              </Button>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-14'>
              <Icons.teams className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>
                {search
                  ? 'Inga prospekter matchar sökningen.'
                  : 'Inga prospekter i den här kampanjen än.'}
              </p>
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead className='bg-muted/60 sticky top-0 z-10 backdrop-blur-sm'>
                <tr className='text-muted-foreground text-left text-[11px] uppercase'>
                  <th className='py-2.5 pr-4 pl-6 font-medium'>Kontakt</th>
                  <th className='py-2.5 pr-4 font-medium'>Telefon</th>
                  <th className='py-2.5 pr-4 font-medium'>Ringstatus</th>
                  <th className='py-2.5 pr-6 font-medium'>Sammanfattning</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((prospect) => (
                  <tr key={prospect.id} className='hover:bg-muted/40 border-b last:border-0'>
                    <td className='py-2.5 pr-4 pl-6'>
                      <span className='font-medium'>
                        {prospect.first_name} {prospect.last_name}
                      </span>
                      {prospect.company && (
                        <span className='text-muted-foreground block text-xs'>
                          {prospect.company}
                        </span>
                      )}
                    </td>
                    <td className='text-muted-foreground py-2.5 pr-4 tabular-nums'>
                      {prospect.phone}
                    </td>
                    <td className='py-2.5 pr-4'>
                      <Badge variant={statusVariant(prospect.status)} className='capitalize'>
                        {STATUS_LABELS[prospect.status] ?? prospect.status}
                      </Badge>
                    </td>
                    <td className='text-muted-foreground line-clamp-2 max-w-[280px] py-2.5 pr-6'>
                      {prospect.call_summary ?? 'Sammanfattning genereras efter samtalet.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidfot: sidnumrering + djuplänk + stäng */}
        <div className='bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-t px-6 py-3'>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {total > 0 ? `${from}–${to} av ${total} prospekter` : 'Inga prospekter'}
          </span>
          <div className='flex flex-wrap items-center gap-2'>
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
            <Button
              variant='outline'
              size='sm'
              render={
                <a
                  href={`/dashboard/campaigns/${campaign?.id ?? ''}`}
                  aria-label='Öppna kampanjdetaljer'
                />
              }
              nativeButton={false}
            >
              <Icons.externalLink className='mr-2 h-3.5 w-3.5' /> Öppna Kampanjdetaljer
            </Button>
            <Button
              variant='outline'
              size='sm'
              render={
                <a
                  href={`/dashboard/contacts?campaign=${campaign?.id ?? ''}`}
                  aria-label='Öppna kampanjen i Kontakter'
                />
              }
              nativeButton={false}
            >
              <Icons.externalLink className='mr-2 h-3.5 w-3.5' /> Öppna i Kontakter
            </Button>
            <Button variant='outline' size='sm' onClick={onClose}>
              Stäng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
