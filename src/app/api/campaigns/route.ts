import { NextRequest, NextResponse } from 'next/server';
import { canCreateCampaigns, getTierDefinition } from '@/config/plans';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth, getTenantMetadata } from '@/lib/pb';
import type {
  Campaign,
  CampaignMutationPayload,
  CampaignsResponse
} from '@/features/campaigns/api/types';

// ============================================================
// Campaigns — Clerk firewall (Read/Write Highway)
// Every query is filtered strictly by the verified orgId so tenants
// cannot cross-pollinate data. Inbound packages (Receptionist /
// AI-Assistent) get no campaign creation.
// ============================================================

export async function GET(request: NextRequest) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;

  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get('page') ?? 1) || 1;
  const limit = Number(sp.get('limit') ?? 10) || 10;
  const status = sp.get('status');
  const search = sp.get('search');
  const sort = sp.get('sort') ?? '-created';

  try {
    const pb = await ensurePbAuth();

    let filter = 'clerk_org_id = {:orgId}';
    const filterParams: Record<string, string> = { orgId };
    if (status) {
      filter += ' && status = {:status}';
      filterParams.status = status;
    }
    if (search) {
      filter += ' && name ~ {:search}';
      filterParams.search = search;
    }

    const resultList = await pb.collection('campaigns').getList(page, limit, {
      filter: pb.filter(filter, filterParams),
      sort
    });

    // Prospekter count per campaign (one light count query per row on the page)
    const items: Campaign[] = [];
    for (const raw of resultList.items) {
      const campaign = raw as unknown as Campaign;
      let prospectCount = 0;
      try {
        const count = await pb.collection('contacts').getList(1, 1, {
          filter: pb.filter('campaign = {:id}', { id: campaign.id })
        });
        prospectCount = count.totalItems;
      } catch {
        prospectCount = 0;
      }
      items.push({ ...campaign, prospect_count: prospectCount });
    }

    const response: CampaignsResponse = {
      items,
      total_items: resultList.totalItems
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'PocketBase svarar inte.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId, userId } = guard.ctx;

  try {
    const body = (await request.json()) as CampaignMutationPayload;
    const pb = await ensurePbAuth();

    // Tenant + package gate: inbound packages (Receptionist / AI-Assistent)
    // get no campaign creation.
    const tenant = await getTenantMetadata(orgId);
    if (!canCreateCampaigns(tenant.subscription_tiers)) {
      return NextResponse.json(
        { error: 'Erbjudandet omfattar inte utgående kampanjer.' },
        { status: 403 }
      );
    }

    // Tier gating — plan limits come from the tenant metadata (offert tiers
    // are never hard-limited in code).
    const outboundTiers = tenant.subscription_tiers
      .map((t) => getTierDefinition(t))
      .filter((t) => t.capabilities.outbound);
    const quoteBased = outboundTiers.some((t) => t.quoteBased);

    if (!quoteBased) {
      const existing = await pb.collection('campaigns').getList(1, 1, {
        filter: pb.filter('clerk_org_id = {:orgId}', { orgId })
      });
      const max = Math.max(...outboundTiers.map((t) => t.maxCampaigns ?? 0), 1);
      if (existing.totalItems >= max) {
        return NextResponse.json(
          {
            error: `Paketen tillåter max ${max} kampanjer. Uppgradera för fler.`
          },
          { status: 402 }
        );
      }
    }

    // Tenant + audit stamp — from the verified session, never the payload.
    const record = await pb.collection('campaigns').create({
      ...body,
      clerk_org_id: orgId,
      created_by: userId,
      status: 'köad'
    });

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Kampanjen kunde inte skapas.' }, { status: 502 });
  }
}