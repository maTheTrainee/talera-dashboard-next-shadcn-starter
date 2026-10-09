import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdminRole, roleGrants } from '@/lib/access';
import type { AccessArea } from '@/types';

export interface AuthContext {
  userId: string;
  orgId: string;
}

export type AuthGuardResult =
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: NextResponse };

/**
 * Clerk firewall gate for EVERY `/api/*` route handler (Tier 1 + 2).
 *
 * Verifies the cryptographic session token and returns the verified tenant
 * context. Handlers must derive ALL PocketBase filters from this context —
 * tenant isolation is structural: data is filtered strictly by the verified
 * orgId so tenants cannot cross-pollinate.
 */
export async function requireAuthContext(): Promise<AuthGuardResult> {
  const { userId, orgId } = await auth();

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  if (!orgId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No active organization — tenant context required.' },
        { status: 403 }
      )
    };
  }

  return { ok: true, ctx: { userId, orgId } };
}

/**
 * Nivå 2 — the ROLE gate: the session's Clerk org role must grant one of the
 * requested access areas (org:admin grants all; the role bundles are defined
 * in src/lib/access.ts). Members get a physical 403 — not just a hidden nav
 * item. The org's packages bound the roles separately (the capability checks
 * on the spending routes).
 */
export async function requireArea(
  ctx: AuthContext,
  ...areas: AccessArea[]
): Promise<boolean> {
  void ctx;
  const { orgRole } = await auth();
  if (isAdminRole(orgRole)) return true;
  const grants = roleGrants(orgRole);
  return areas.some((area) => grants.includes(area));
}

/**
 * Nivå 2 — org:admin ONLY: the management surfaces (Översikt, usage,
 * numbers-config). Members get a physical 403.
 */
export async function requireOrgAdmin(ctx: AuthContext): Promise<boolean> {
  void ctx;
  const { orgRole } = await auth();
  return isAdminRole(orgRole);
}