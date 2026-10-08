export interface UsageResponse {
  tiers: string[];
  tierLabels: string[];
  capabilities: {
    outbound: boolean;
    inbound: boolean;
    booking: boolean;
    internal: boolean;
  };
  /** null = offert only — no hard limit. */
  minutePool: number | null;
  minutesUsed: number;
  minutesRemaining: number | null;
  poolUtilizationPercent: number | null;
  overageMinutes: number;
  overageRateSekPerMin: number;
  liabilitySek: number;
}