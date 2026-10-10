'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { deleteCampaignMutation } from '../api/mutations';
import type { Campaign } from '../api/types';

interface DeleteCampaignDialogProps {
  campaign: Campaign | null;
  onClose: () => void;
}

/**
 * Radera kampanj — en admin-åtgärd (403-grindad API-sida). Kampanjen raderas
 * permanent och dess prospekter KOPPLAS BORT (campaign-fältet töms) —
 * kontakterna behålls i Kontakter och kan läggas i en ny kampanj efteråt.
 */
export function DeleteCampaignDialog({ campaign, onClose }: DeleteCampaignDialogProps) {
  const mutation = useMutation({
    ...deleteCampaignMutation,
    onSuccess: (result) => {
      toast.success(
        result.unlinked > 0
          ? `Kampanjen raderad — ${result.unlinked} prospekter kopplade bort`
          : 'Kampanjen raderad'
      );
      onClose();
    },
    onError: (error) => toast.error(error.message)
  });

  const prospectCount = campaign?.prospect_count ?? 0;

  return (
    <AlertDialog
      open={!!campaign}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Radera kampanjen?</AlertDialogTitle>
          <AlertDialogDescription>
            {campaign?.name ? `"${campaign.name}"` : 'Kampanjen'} raderas permanent.
            {prospectCount > 0
              ? ` ${prospectCount} prospekter kopplas bort — kontakterna behålls i Kontakter och kan läggas i en ny kampanj efteråt.`
              : ' Inga prospekter är kopplade till kampanjen.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive text-white hover:bg-destructive/90'
            disabled={mutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              if (campaign) mutation.mutate(campaign.id);
            }}
          >
            {mutation.isPending ? 'Raderar…' : 'Radera kampanjen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
