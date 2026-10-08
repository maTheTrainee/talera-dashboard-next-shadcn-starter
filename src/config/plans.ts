import type { SubscriptionTier } from '@/types/tenant';

/**
 * Outbound campaign plan matrix (SEK pricing / daily minute limits).
 * ENTERPRISE is a bespoke, quote-based tier — volume bounds are negotiated per
 * contract and are therefore null here (never hard-limited in code).
 */
export interface TierDefinition {
  tier: SubscriptionTier;
  label: string;
  priceSekPerMonth: number | null; // null = custom offert via sales
  dailyMinuteLimit: number | null; // null = bespoke bounds
  maxAgents: number | null;
  maxCampaigns: number | null;
  maxNumbers: number | null;
  /** Quote-based tiers (ENTERPRISE) are never hard-limited in code. */
  quoteBased: boolean;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierDefinition> = {
  DELTID: {
    tier: 'DELTID',
    label: 'Deltid',
    priceSekPerMonth: 11900,
    dailyMinuteLimit: 75,
    maxAgents: 1,
    maxCampaigns: 1,
    maxNumbers: 1,
    quoteBased: false
  },
  HELTID: {
    tier: 'HELTID',
    label: 'Heltid (vanligast)',
    priceSekPerMonth: 19900,
    dailyMinuteLimit: 150,
    maxAgents: 1,
    maxCampaigns: 1,
    maxNumbers: 1,
    quoteBased: false
  },
  TEAM: {
    tier: 'TEAM',
    label: 'Team',
    priceSekPerMonth: 30900,
    dailyMinuteLimit: 300,
    maxAgents: 2,
    maxCampaigns: 2,
    maxNumbers: 2,
    quoteBased: false
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    label: 'Enterprise',
    priceSekPerMonth: null,
    dailyMinuteLimit: null,
    maxAgents: null,
    maxCampaigns: null,
    maxNumbers: null,
    quoteBased: true
  }
};

/** Accrued overage liability price (exkl. moms). */
export const OVERAGE_RATE_SEK_PER_MIN = 5.9;

export function getTierDefinition(tier: string | undefined | null): TierDefinition {
  const key = (tier ?? 'DELTID') as SubscriptionTier;
  return SUBSCRIPTION_TIERS[key] ?? SUBSCRIPTION_TIERS.DELTID;
}

export interface OverageResult {
  overageMinutes: number;
  liabilitySek: number;
}

/**
 * Overage logic: outbound calls are never dropped midway through execution if
 * a quota is depleted. Extra consumption is tracked by the automation engine in
 * PocketBase and displayed on screen as an accrued liability priced at
 * 5,90 kr per minute (exkl. moms).
 */
export function computeOverage(minutesUsed: number, tier: TierDefinition): OverageResult {
  const limit = tier.dailyMinuteLimit;
  if (limit == null) {
    return { overageMinutes: 0, liabilitySek: 0 };
  }
  const overageMinutes = Math.max(0, minutesUsed - limit);
  const liabilitySek = Math.round(overageMinutes * OVERAGE_RATE_SEK_PER_MIN * 100) / 100;
  return { overageMinutes, liabilitySek };
}