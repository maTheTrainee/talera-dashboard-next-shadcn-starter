import { NextRequest, NextResponse } from 'next/server';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth } from '@/lib/pb';
import type { Contact, ContactsResponse, ContactMutationPayload } from '@/features/contacts/api/types';

// ============================================================
// Contacts (Kontaktlistor) — Clerk firewall. All queries are filtered
// strictly by the verified orgId (tenant isolation).
// ============================================================

export async function GET(request: NextRequest) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;

  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get('page') ?? 1) || 1;
  const limit = Number(sp.get('limit') ?? 10) || 10;
  const status = sp.get('status');
  const campaign = sp.get('campaign');
  const search = sp.get('search');
  const sort = sp.get('sort') ?? '-updated';

  try {
    const pb = await ensurePbAuth();

    let filter = 'clerk_org_id = {:orgId}';
    const filterParams: Record<string, string> = { orgId };
    // Multi-select filters arrive comma-separated (nuqs arrays) — OR-chains.
    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length > 0) {
        filter += ` && (${statuses
          .map((_, i) => `status = {:status${i}}`)
          .join(' || ')})`;
        statuses.forEach((s, i) => {
          filterParams[`status${i}`] = s;
        });
      }
    }
    if (campaign) {
      const campaigns = campaign.split(',').filter(Boolean);
      if (campaigns.length > 0) {
        filter += ` && (${campaigns
          .map((_, i) => `campaign = {:campaign${i}}`)
          .join(' || ')})`;
        campaigns.forEach((c, i) => {
          filterParams[`campaign${i}`] = c;
        });
      }
    }
    if (search) {
      filter += ' && (first_name ~ {:search} || last_name ~ {:search} || phone ~ {:search})';
      filterParams.search = search;
    }

    const resultList = await pb.collection('contacts').getList(page, limit, {
      filter: pb.filter(filter, filterParams),
      sort,
      expand: 'campaign'
    });

    // Kampanjnamn expanderas server-side — ingen extra klientfråga.
    const items: Contact[] = resultList.items.map((raw) => {
      const contact = raw as unknown as Contact;
      const expand = (
        raw as unknown as { expand?: { campaign?: { name?: string } | null } }
      ).expand;
      return { ...contact, campaign_name: expand?.campaign?.name ?? null };
    });

    const response: ContactsResponse = {
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
    const body = (await request.json()) as ContactMutationPayload;
    const pb = await ensurePbAuth();

    // Tenant + audit stamp — from the verified session, never the payload.
    const record = await pb.collection('contacts').create({
      ...body,
      clerk_org_id: orgId,
      created_by: userId,
      status: body.status ?? 'ny'
    });

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Kontakten kunde inte skapas.' }, { status: 502 });
  }
}