'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { updateCampaignMutation } from '../../api/mutations';
import type { Campaign } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { CampaignFormSheet } from '../campaign-form-sheet';
import { ResumeCampaignDialog } from '../resume-campaign-dialog';
import { DeleteCampaignDialog } from '../delete-campaign-dialog';

interface CellActionProps {
  data: Campaign;
}

export function CellAction({ data }: CellActionProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  const statusMutation = useMutation({
    ...updateCampaignMutation,
    onSuccess: () => toast.success('Kampanjstatus uppdaterad'),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'Kunde inte uppdatera kampanjstatus')
  });

  const canStart = data.status === 'köad' || data.status === 'pausad';

  return (
    <>
      <CampaignFormSheet campaign={data} open={editOpen} onOpenChange={setEditOpen} />
      <ResumeCampaignDialog
        campaign={resumeOpen ? data : null}
        onClose={() => setResumeOpen(false)}
      />
      <DeleteCampaignDialog
        campaign={deleteOpen ? data : null}
        onClose={() => setDeleteOpen(false)}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant='ghost' className='h-8 w-8 p-0' />}>
          <span className='sr-only'>Öppna meny</span>
          <Icons.ellipsis className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Icons.edit className='mr-2 h-4 w-4' /> Redigera
            </DropdownMenuItem>
            {canStart && (
              <DropdownMenuItem
                onClick={() => statusMutation.mutate({ id: data.id, values: { status: 'live' } })}
              >
                <Icons.send className='mr-2 h-4 w-4' /> Starta (Live)
              </DropdownMenuItem>
            )}
            {data.status === 'live' && (
              <DropdownMenuItem
                onClick={() => statusMutation.mutate({ id: data.id, values: { status: 'pausad' } })}
              >
                Pausa
              </DropdownMenuItem>
            )}
            {data.status === 'avslutad' && (
              <DropdownMenuItem onClick={() => setResumeOpen(true)}>
                <Icons.clock className='mr-2 h-4 w-4' /> Återuppta
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              <Icons.trash className='mr-2 h-4 w-4' /> Radera
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${data.id}`)}>
              <Icons.externalLink className='mr-2 h-4 w-4' /> Öppna Kampanjdetaljer
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
