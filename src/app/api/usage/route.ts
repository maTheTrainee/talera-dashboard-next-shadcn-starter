import { NextResponse } from 'next/server';
import {
  computeOverage,
  getCapabilities,
  getTierDefinition,
  OVERAGE_RATE_SEK_PER_MIN
} from '@/config/plans';
import { requireOrgAdmin, requireAuthContext } from '@/lib/api-auth';
import { ensurePbOrgAuth, getTenantMetadata } from '@/lib/pb';

// ============================================================
// Usage — Clerk firewall. Pool model: consumption = sum of usage_daily for
// the current billing month, reported against the tier's minute pool.
// Offert tiers (minutePool = null) are display-only — never gated.
// ============================================================

export async function GET() {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;

  // Nivå 2 — användning/minutpoolen är en admin-yta.
  if (!(await requireOrgAdmin(guard.ctx))) {
    return NextResponse.json(
      { error: 'Du saknar behörighet för den här funktionen.' },
      { status: 403 }
    );
  }

  const tenant = await getTenantMetadata(orgId);
  const capabilities = getCapabilities(tenant.subscription_tiers);
  const tierDefs = tenant.subscription_tiers.map((t) => getTierDefinition(t));
  const outboundTiers = tierDefs.filter((t) => t.capabilities.outbound);
  // Pool model: the tenant's outbound packages share the largest pool.
  const pool =
    outboundTiers.length > 0
      ? Math.max(...outboundTiers.map((t) => t.minutePool ?? 0))
      : null;

  let minutesUsed = 0;
  try {
    const pb = await ensurePbOrgAuth(orgId);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const result = await pb.collection('usage_daily').getList(1, 200, {
      filter: pb.filter('clerk_org_id = {:orgId} && date >= {:from}', {
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

  const overage = computeOverage(minutesUsed, {
    ...outboundTiers[0] ?? getTierDefinition('DELTID'),
    minutePool: pool
  });

  return NextResponse.json({
    tiers: tenant.subscription_tiers,
    tierLabels: tenant.subscription_tiers.map((t) => getTierDefinition(t).label),
    capabilities,
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