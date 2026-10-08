import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export interface AuthContext {
  userId: string;
  orgId: string;
}

export type AuthGuardResult =
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: NextResponse };

/**
 * Clerk firewall gate for EVERY `/api/*` route handler.
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