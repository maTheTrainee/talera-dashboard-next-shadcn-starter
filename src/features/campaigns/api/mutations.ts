import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createCampaign, updateCampaign } from './service';
import { campaignKeys } from './queries';
import type { CampaignMutationPayload, CampaignUpdatePayload } from './types';

export const createCampaignMutation = mutationOptions({
  mutationFn: (data: CampaignMutationPayload) => createCampaign(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: campaignKeys.all });
  }
});

export const updateCampaignMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: CampaignUpdatePayload }) =>
    updateCampaign(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: campaignKeys.all });
  }
});