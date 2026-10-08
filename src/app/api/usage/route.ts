import { NextResponse } from 'next/server';
import { computeOverage, getTierDefinition, OVERAGE_RATE_SEK_PER_MIN } from '@/config/plans';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth, getTenantMetadata } from '@/lib/pb';

// ============================================================
// Usage — Clerk firewall. Daily minute quota + accrued overage liability
// for the Översikt dashboard. Overage minutes are tracked by the automation
// engine in PocketBase (usage_daily collection).
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
    const today = new Date().toISOString().slice(0, 10);
    const result = await pb.collection('usage_daily').getList(1, 1, {
      filter: pb.filter('org_id = {:orgId} && date = {:date}', { orgId, date: today })
    });
    minutesUsed = Number(result.items[0]?.minutes_used ?? 0);
  } catch {
    // usage_daily not provisioned yet — report zeros so the UI still renders.
  }

  const overage = computeOverage(minutesUsed, tier);

  return NextResponse.json({
    tier: tenant.subscription_tier,
    tierLabel: tier.label,
    dailyMinuteLimit: tier.dailyMinuteLimit,
    minutesUsed,
    overageMinutes: overage.overageMinutes,
    overageRateSekPerMin: OVERAGE_RATE_SEK_PER_MIN,
    liabilitySek: overage.liabilitySek
  });
}