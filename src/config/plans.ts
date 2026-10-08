import type { SubscriptionTier } from '@/types/tenant';

/**
 * Talera product matrix — two product lines:
 * - OUTBOUND (kampanjer): minute-pool packages + ENTERPRISE (offert).
 * - INBOUND: Receptionist + AI-Assistent (offert only — no campaign creation).
 *
 * Offert semantics: `minutePool = null` means "offert only" — volymen
 * förhandlas per avtal och är aldrig hårt begränsad i koden.
 */

export type ProductLine = 'outbound' | 'inbound';

export interface TierDefinition {
  tier: SubscriptionTier;
  label: string;
  productLine: ProductLine;
  priceSekPerMonth: number | null; // null = offert via sälj
  /** Total minute pool per billing period. null = offert only (no hard limit). */
  minutePool: number | null;
  maxAgents: number | null;
  maxCampaigns: number | null;
  maxNumbers: number | null;
  /** Quote-based tiers are never hard-limited in code. */
  quoteBased: boolean;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierDefinition> = {
  DELTID: {
    tier: 'DELTID',
    label: 'Deltid',
    productLine: 'outbound',
    priceSekPerMonth: 11900,
    // TODO: bekräfta poolstorlekar
    minutePool: 500,
    maxAgents: 1,
    maxCampaigns: 1,
    maxNumbers: 1,
    quoteBased: false
  },
  HELTID: {
    tier: 'HELTID',
    label: 'Heltid (vanligast)',
    productLine: 'outbound',
    priceSekPerMonth: 19900,
    // TODO: bekräfta poolstorlekar
    minutePool: 1000,
    maxAgents: 1,
    maxCampaigns: 1,
    maxNumbers: 1,
    quoteBased: false
  },
  TEAM: {
    tier: 'TEAM',
    label: 'Team',
    productLine: 'outbound',
    priceSekPerMonth: 30900,
    // TODO: bekräfta poolstorlekar
    minutePool: 2000,
    maxAgents: 2,
    maxCampaigns: 2,
    maxNumbers: 2,
    quoteBased: false
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    label: 'Enterprise',
    productLine: 'outbound',
    priceSekPerMonth: null,
    minutePool: null,
    maxAgents: null,
    maxCampaigns: null,
    maxNumbers: null,
    quoteBased: true
  },
  RECEPTIONIST: {
    tier: 'RECEPTIONIST',
    label: 'Receptionist',
    productLine: 'inbound',
    priceSekPerMonth: null,
    minutePool: null,
    maxAgents: null,
    maxCampaigns: null,
    maxNumbers: null,
    quoteBased: true
  },
  AI_ASSISTENT: {
    tier: 'AI_ASSISTENT',
    label: 'AI-Assistent',
    productLine: 'inbound',
    priceSekPerMonth: null,
    minutePool: null,
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
 * Overage logic: calls are never dropped midway when the pool is depleted —
 * extra consumption accrues as a liability priced at 5,90 kr/min (exkl. moms).
 * Offert tiers (minutePool = null) are display-only — never gated.
 */
export function computeOverage(minutesUsed: number, tier: TierDefinition): OverageResult {
  const pool = tier.minutePool;
  if (pool == null) {
    return { overageMinutes: 0, liabilitySek: 0 };
  }
  const overageMinutes = Math.max(0, minutesUsed - pool);
  const liabilitySek = Math.round(overageMinutes * OVERAGE_RATE_SEK_PER_MIN * 100) / 100;
  return { overageMinutes, liabilitySek };
}

/** Inbound packages (Receptionist / AI-Assistent) get no campaign creation. */
export function canCreateCampaigns(tier: string | undefined | null): boolean {
  return getTierDefinition(tier).productLine === 'outbound';
}