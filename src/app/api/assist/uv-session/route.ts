import { NextResponse } from 'next/server';
import { requireAuthContext } from '@/lib/api-auth';
import { getTenantMetadata } from '@/lib/pb';
import { dispatchToN8n } from '@/lib/n8n';
import type { UVSessionResponse } from '@/types/tenant';

/**
 * Ring AI-Assistent — the secure browser WebRTC bridge.
 *
 * The browser NEVER holds engine credentials: it posts here, the route verifies
 * the Clerk session + tenant context, dispatches the standardized tenant
 * metadata envelope to n8n (action `start.web.session`), and hands back a
 * temporary, single-use, short-lived session URL. The frontend initializes the
 * uv-client SDK using only this token.
 */
export async function POST() {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;

  const { userId, orgId } = guard.ctx;
  const tenant = await getTenantMetadata(orgId);

  try {
    const result = await dispatchToN8n<{ user_id: string }, UVSessionResponse>(
      'start.web.session',
      tenant,
      { user_id: userId }
    );

    if (!result?.joinUrl) {
      return NextResponse.json(
        { error: 'Kunde inte starta sessionen — försök igen.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ uvSessionToken: result.joinUrl });
  } catch {
    return NextResponse.json(
      { error: 'Sessionen kunde inte etableras — automationen svarar inte.' },
      { status: 502 }
    );
  }
}