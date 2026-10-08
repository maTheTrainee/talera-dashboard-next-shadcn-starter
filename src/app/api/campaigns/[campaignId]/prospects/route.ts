import { NextRequest, NextResponse } from 'next/server';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth } from '@/lib/pb';
import type { CampaignProspect, ProspectsResponse } from '@/features/campaigns/api/types';

// ============================================================
// Campaign prospects — the nested deep-dive relational lead grid.
// The parent campaign's org_id must match the verified orgId before the
// relational contacts query is allowed (tenant isolation).
// ============================================================

type RouteContext = { params: Promise<{ campaignId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;
  const { campaignId } = await params;

  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get('page') ?? 1) || 1;
  const limit = Number(sp.get('limit') ?? 25) || 25;
  const status = sp.get('status');
  const search = sp.get('search');
  const sort = sp.get('sort') ?? '-updated';

  try {
    const pb = await ensurePbAuth();

    const campaign = await pb.collection('campaigns').getOne(campaignId);
    if (campaign.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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