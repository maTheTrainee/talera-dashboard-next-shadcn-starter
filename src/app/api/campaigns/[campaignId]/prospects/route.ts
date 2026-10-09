import { NextRequest, NextResponse } from 'next/server';
import { requireArea, requireAuthContext } from '@/lib/api-auth';
import { ensurePbOrgAuth } from '@/lib/pb';
import type { CampaignProspect, ProspectsResponse } from '@/features/campaigns/api/types';

// ============================================================
// Campaign prospects — the nested deep-dive relational lead grid.
// The parent campaign's clerk_org_id must match the verified orgId before the
// relational contacts query is allowed (tenant isolation).
// ============================================================

type RouteContext = { params: Promise<{ campaignId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;
  const { campaignId } = await params;

  // Nivå 2 — utgående-området krävs (roll ∩ paket).
  if (!(await requireArea(guard.ctx, 'utgaende'))) {
    return NextResponse.json(
      { error: 'Du saknar behörighet för den här funktionen.' },
      { status: 403 }
    );
  }

  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get('page') ?? 1) || 1;
  const limit = Number(sp.get('limit') ?? 25) || 25;
  const status = sp.get('status');
  const search = sp.get('search');
  const sort = sp.get('sort') ?? '-updated';

  try {
    const pb = await ensurePbOrgAuth(orgId);

    const campaign = await pb.collection('campaigns').getOne(campaignId);
    if (campaign.clerk_org_id !== orgId) {
      // 404 — cross-tenant id probes must not reveal that the campaign exists.
      return NextResponse.json(
        { error: 'Kunde inte hämta prospekten.' },
        { status: 404 }
      );
    }

    let filter = 'campaign = {:campaignId}';
    const filterParams: Record<string, string> = { campaignId };
    if (status) {
      filter += ' && status = {:status}';
      filterParams.status = status;
    }
    if (search) {
      filter += ' && (first_name ~ {:search} || last_name ~ {:search} || phone ~ {:search})';
      filterParams.search = search;
    }

    const resultList = await pb.collection('contacts').getList(page, limit, {
      filter: pb.filter(filter, filterParams),
      sort
    });

    const response: ProspectsResponse = {
      items: resultList.items as unknown as CampaignProspect[],
      total_items: resultList.totalItems
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Kunde inte hämta prospekten.' }, { status: 502 });
  }
}