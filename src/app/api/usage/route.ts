import { NextResponse } from 'next/server';
import { computeOverage, getTierDefinition, OVERAGE_RATE_SEK_PER_MIN } from '@/config/plans';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth, getTenantMetadata } from '@/lib/pb';

// ============================================================
// Usage — Clerk firewall. Pool model: consumption = sum of usage_daily for
// the current billing month, reported against the tier's minute pool.
// Offert tiers (minutePool = null) are display-only — never gated.
// ============================================================

export async function GET() {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;

  const tenant = await getTenantMetadata(orgId);
  const tier = getTierDefinition(tenant.subscription_tier);

  let minutesUsed = 0;
  try {
    const pb = await ensurePbAuth();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const result = await pb.collection('usage_daily').getList(1, 200, {
      filter: pb.filter('org_id = {:orgId} && date >= {:from}', {
        orgId,
        from: monthStart.toISOString().slice(0, 10)
      }),
      sort: '-date'
    });
    minutesUsed = result.items.reduce(
      (sum, row) => sum + Number(row.minutes_used ?? 0),
      0
    );
  } catch {
    // usage_daily not provisioned yet — report zeros so the UI still renders.
  }

  const overage = computeOverage(minutesUsed, tier);
  const pool = tier.minutePool;

  return NextResponse.json({
    tier: tenant.subscription_tier,
    tierLabel: tier.label,
    productLine: tier.productLine,
    minutePool: pool,
    minutesUsed,
    minutesRemaining: pool == null ? null : Math.max(0, pool - minutesUsed),
    poolUtilizationPercent:
      pool == null ? null : Math.min(100, Math.round((minutesUsed / pool) * 100)),
    overageMinutes: overage.overageMinutes,
    overageRateSekPerMin: OVERAGE_RATE_SEK_PER_MIN,
    liabilitySek: overage.liabilitySek
  });
}