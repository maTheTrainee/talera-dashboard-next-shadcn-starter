export interface UsageResponse {
  tier: string;
  tierLabel: string;
  productLine: string;
  /** null = offert only — no hard limit. */
  minutePool: number | null;
  minutesUsed: number;
  minutesRemaining: number | null;
  poolUtilizationPercent: number | null;
  overageMinutes: number;
  overageRateSekPerMin: number;
  liabilitySek: number;
}