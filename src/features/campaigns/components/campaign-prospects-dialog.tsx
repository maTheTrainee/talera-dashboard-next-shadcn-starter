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
import { useQuery } from '@tanstack/react-query';
import { campaignProspectsOptions } from '../api/queries';

interface CampaignProspectsDialogProps {
  campaign: { id: string; name: string } | null;
  onClose: () => void;
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

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  return status === 'avslutat' || status === 'i_samtal'
    ? 'default'
    : status === 'ringer' || status === 'uppföljning'
      ? 'secondary'
      : 'outline';
}

/**
 * Kampanjprospekt-popup — "en popup av Kontaktlistor-sidan" showing only the
 * prospects tagged with the clicked campaign. Feeds from the existing
 * tenant-isolated /api/campaigns/[campaignId]/prospects route; the
 * "Öppna i Kontaktlistor" deep link pre-selects the Kampanj filter.
 */
export function CampaignProspectsDialog({
  campaign,
  onClose
}: CampaignProspectsDialogProps) {
  const { data, isPending } = useQuery({
    ...campaignProspectsOptions(campaign?.id ?? '', { limit: 100 }),
    enabled: !!campaign
  });

  return (
    <Dialog open={!!campaign} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{campaign?.name ?? 'Kampanj'}</DialogTitle>
          <DialogDescription>
            Prospekter kopplade till kampanjen — samma vy som Kontaktlistor.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className='space-y-2'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='bg-muted h-12 animate-pulse rounded-lg' />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>
            Inga prospekter i den här kampanjen än.
          </p>
        ) : (
          <div className='max-h-[420px] overflow-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-muted-foreground border-b text-left text-xs uppercase'>
                  <th className='py-2 pr-3 font-medium'>Kontakt</th>
                  <th className='py-2 pr-3 font-medium'>Telefon</th>
                  <th className='py-2 pr-3 font-medium'>Ringstatus</th>
                  <th className='py-2 pr-3 font-medium'>Sammanfattning</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((prospect) => (
                  <tr key={prospect.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>
                      <span className='font-medium'>
                        {prospect.first_name} {prospect.last_name}
                      </span>
                      {prospect.company && (
                        <span className='text-muted-foreground block text-xs'>
                          {prospect.company}
                        </span>
                      )}
                    </td>
                    <td className='text-muted-foreground py-2 pr-3'>
                      {prospect.phone}
                    </td>
                    <td className='py-2 pr-3'>
                      <Badge
                        variant={statusVariant(prospect.status)}
                        className='capitalize'
                      >
                        {STATUS_LABELS[prospect.status] ?? prospect.status}
                      </Badge>
                    </td>
                    <td className='text-muted-foreground line-clamp-2 max-w-[240px] py-2 pr-3'>
                      {prospect.call_summary ??
                        'Sammanfattning genereras efter samtalet.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className='flex items-center justify-between gap-2'>
          <p className='text-muted-foreground text-xs'>
            {data ? `${data.total_items} prospekter` : ''}
          </p>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              render={
                <a
                  href={`/dashboard/contacts?campaign=${campaign?.id ?? ''}`}
                  aria-label='Öppna kampanjen i Kontaktlistor'
                />
              }
              nativeButton={false}
            >
              <Icons.externalLink className='mr-2 h-4 w-4' /> Öppna i Kontaktlistor
            </Button>
            <Button variant='outline' onClick={onClose}>
              <Icons.close className='mr-2 h-4 w-4' /> Stäng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
