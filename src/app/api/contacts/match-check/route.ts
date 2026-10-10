import { NextRequest, NextResponse } from 'next/server';
import { requireArea, requireAuthContext } from '@/lib/api-auth';
import { ensurePbOrgAuth } from '@/lib/pb';
import { normalizePhoneNumber } from '@/features/campaigns/schemas/campaign';

// ============================================================
// Bulk phone-match check — Clerk firewall, tenant-isolated. Powers the
// wizard's "Granska & koppla" step: which CSV rows already exist in
// Kontakter (matched on the normalized phone — the natural unique key)?
// ============================================================

export async function POST(request: NextRequest) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;

  // Nivå 2 — utgående eller inkommande området krävs.
  if (!(await requireArea(guard.ctx, 'utgaende', 'inkommande'))) {
    return NextResponse.json(
      { error: 'Du saknar behörighet för den här funktionen.' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as { phones?: string[] };
    const phones = (body.phones ?? [])
      .slice(0, 500)
      .map((p) => normalizePhoneNumber(p))
      .filter(Boolean);

    if (phones.length === 0) {
      return NextResponse.json({ matches: {} });
    }

    const pb = await ensurePbOrgAuth(orgId);
    const matches: Record<string, string> = {};

    // Chunked OR-queries (PB filter length) — 100 phones per query.
    for (let i = 0; i < phones.length; i += 100) {
      const chunk = phones.slice(i, i + 100);
      const or = `(${chunk.map((_, j) => `phone = {:p${j}}`).join(' || ')})`;
      const params: Record<string, string> = { orgId };
      chunk.forEach((p, j) => {
        params[`p${j}`] = p;
      });
      const result = await pb.collection('contacts').getList(1, 200, {
        filter: pb.filter(`clerk_org_id = {:orgId} && ${or}`, params)
      });
      for (const item of result.items) {
        const phone = (item as { phone?: string }).phone;
        if (phone) matches[phone] = item.id;
      }
    }

    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json(
      { error: 'Matchningen kunde inte göras.' },
      { status: 502 }
    );
  }
}
