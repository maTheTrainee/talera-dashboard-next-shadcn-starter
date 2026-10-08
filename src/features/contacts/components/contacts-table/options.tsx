import type { ProspectStatus } from '@/features/campaigns/api/types';

export const PROSPECT_STATUS_OPTIONS: { value: ProspectStatus; label: string }[] = [
  { value: 'ny', label: 'Ny' },
  { value: 'i_ko', label: 'I kö' },
  { value: 'ringer', label: 'Ringer' },
  { value: 'i_samtal', label: 'I samtal' },
  { value: 'avslutat', label: 'Avslutat' },
  { value: 'ej_svar', label: 'Ej svar' }
];
