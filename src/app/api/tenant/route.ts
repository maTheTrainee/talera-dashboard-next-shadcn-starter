import { NextResponse } from 'next/server';
import { requireAuthContext } from '@/lib/api-auth';
import { getTenantMetadata } from '@/lib/pb';

// ============================================================
// Tenant context — Clerk firewall. The client UI (the wizard) reads the
// evenings add-on here: without it the late time options are greyed and the
// Kväll chip is locked.
// ============================================================

export async function GET() {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const tenant = await getTenantMetadata(guard.ctx.orgId);

  return NextResponse.json({
    subscription_tiers: tenant.subscription_tiers,
    evenings: tenant.evenings
  });
}
