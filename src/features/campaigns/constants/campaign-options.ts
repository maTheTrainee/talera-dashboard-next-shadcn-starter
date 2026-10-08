import type { CampaignStatus } from '../api/types';

export const CAMPAIGN_STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: 'köad', label: 'Köad' },
  { value: 'live', label: 'Live' },
  { value: 'pausad', label: 'Pausad' },
  { value: 'avslutad', label: 'Avslutat' }
];