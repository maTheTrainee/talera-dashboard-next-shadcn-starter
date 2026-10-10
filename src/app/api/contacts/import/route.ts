import { NextRequest, NextResponse } from 'next/server';
import { requireArea, requireAuthContext } from '@/lib/api-auth';
import { ensurePbOrgAuth } from '@/lib/pb';
import { normalizePhoneNumber } from '@/features/campaigns/schemas/campaign';

type ImportRow = {
  first_name?: string;
  last_name?: string;
  company?: string;
  org_number?: string;
  email?: string;
  phone?: string;
};

// ============================================================
// Import kontakter (utan kampanj) — Clerk firewall. Creates NEW contacts
 // (tenant-stamped: clerk_org_id + created_by) and leaves existing ones
// untouched (reported as skipped).
// ============================================================

export async function POST(request: NextRequest) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId, userId } = guard.ctx;

  if (!(await requireArea(guard.ctx, 'utgaende', 'inkommande'))) {
    return NextResponse.json(
      { error: 'Du saknar behörighet för den här funktionen.' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as { rows?: ImportRow[] };
    const rows = (body.rows ?? []).slice(0, 1000);

    const pb = await ensurePbOrgAuth(orgId);

    const phones = [...new Set(rows.map((r) => normalizePhoneNumber(r.phone ?? '')).filter(Boolean))];
    const matches = new Set<string>();
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
        if (phone) matches.add(phone);
      }
    }

    let created = 0;
    let skipped = 0;
    let invalid = 0;
    for (const row of rows) {
      const phone = normalizePhoneNumber(row.phone ?? '');
      if (!phone) {
        invalid++;
        continue;
      }
      if (matches.has(phone)) {
        skipped++;
        continue;
      }
      await pb.collection('contacts').create({
        ...row,
        phone,
        clerk_org_id: orgId,
        created_by: userId,
        status: 'ny'
      });
      created++;
    }

    return NextResponse.json({ created, skipped, invalid });
  } catch {
    return NextResponse.json(
      { error: 'Importen kunde inte göras.' },
      { status: 502 }
    );
  }
}
