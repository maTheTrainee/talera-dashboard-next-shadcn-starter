import { NextResponse } from 'next/server';
import { getCapabilities } from '@/config/plans';
import { requireAuthContext } from '@/lib/api-auth';
import { getTenantMetadata } from '@/lib/pb';
import { dispatchToN8n } from '@/lib/n8n';
import type { UVSessionResponse } from '@/types/tenant';

// Enkel per-användare cooldown — varje start.web.session skapar en betald
// enginesession. In-memory (single instance); scale-facing rate limits via
// Upstash/Ratelimit kan läggas till senare.
const SESSION_COOLDOWN_MS = 30_000;
const lastSessionAt = new Map<string, number>();

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

  // Paketgrind — assistenten kräver ett paket med internt stöd
  // (AI-Assistent / RECEPTIONIST_BOOKER).
  const caps = getCapabilities(tenant.subscription_tiers);
  if (!caps.internal) {
    return NextResponse.json(
      { error: 'Erbjudandet omfattar inte AI-Assistenten.' },
      { status: 403 }
    );
  }

  // Cooldown — skyddar minutpoolen från upprepade klick.
  const now = Date.now();
  if (now - (lastSessionAt.get(userId) ?? 0) < SESSION_COOLDOWN_MS) {
    return NextResponse.json(
      { error: 'Vänta en stund innan du startar ett nytt samtal.' },
      { status: 429 }
    );
  }
  lastSessionAt.set(userId, now);
  for (const [id, at] of lastSessionAt) {
    if (now - at > 10 * 60_000) lastSessionAt.delete(id);
  }

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