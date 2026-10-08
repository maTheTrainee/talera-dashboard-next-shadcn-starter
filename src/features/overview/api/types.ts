export interface UsageResponse {
  tier: string;
  tierLabel: string;
  dailyMinuteLimit: number | null;
  minutesUsed: number;
  overageMinutes: number;
  overageRateSekPerMin: number;
  liabilitySek: number;
}