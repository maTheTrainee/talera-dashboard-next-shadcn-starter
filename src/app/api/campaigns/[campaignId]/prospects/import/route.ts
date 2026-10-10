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

type ImportChoice = 'link' | 'create' | 'skip';

// ============================================================
// Import prospekter till en kampanj — the wizard's finalize step.
// rows = the parsed CSV rows; choices = the per-phone conflict decision
// ('link' = koppla den befintliga kontakten, 'create' = skapa ändå,
// 'skip' = hoppa över). All writes are tenant-stamped
// (clerk_org_id + created_by); linking never duplicates a contact.
// ============================================================

type RouteContext = { params: Promise<{ campaignId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId, userId } = guard.ctx;
  const { campaignId } = await params;

  // Nivå 2 — utgående-området krävs.
  if (!(await requireArea(guard.ctx, 'utgaende'))) {
    return NextResponse.json(
      { error: 'Du saknar behörighet för den här funktionen.' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      rows?: ImportRow[];
      choices?: Record<string, ImportChoice>;
    };
    const rows = (body.rows ?? []).slice(0, 1000);
    const choices = body.choices ?? {};

    const pb = await ensurePbOrgAuth(orgId);
    const campaign = await pb.collection('campaigns').getOne(campaignId);
    if (campaign.clerk_org_id !== orgId) {
      // 404 — cross-tenant id probes must not reveal that the campaign exists.
      return NextResponse.json(
        { error: 'Kampanjen hittades inte.' },
        { status: 404 }
      );
    }

    const phones = [...new Set(rows.map((r) => normalizePhoneNumber(r.phone ?? '')).filter(Boolean))];
    const matches: Record<string, string> = {};
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

    let created = 0;
    let linked = 0;
    let skipped = 0;
    let invalid = 0;
    for (const row of rows) {
      const phone = normalizePhoneNumber(row.phone ?? '');
      if (!phone) {
        invalid++;
        continue;
      }
      const choice: ImportChoice =
        choices[phone] ?? (matches[phone] ? 'link' : 'create');
      if (choice === 'skip') {
        skipped++;
        continue;
      }
      if (choice === 'link' && matches[phone]) {
        // Koppla den befintliga kontakten till kampanjen — ingen duplicering.
        await pb.collection('contacts').update(matches[phone], {
          campaign: campaignId
        });
        linked++;
        continue;
      }
      await pb.collection('contacts').create({
        ...row,
        phone,
        campaign: campaignId,
        clerk_org_id: orgId,
        created_by: userId,
        status: 'i_ko'
      });
      created++;
    }

    return NextResponse.json({ created, linked, skipped, invalid });
  } catch {
    return NextResponse.json(
      { error: 'Importen kunde inte göras.' },
      { status: 502 }
    );
  }
}
