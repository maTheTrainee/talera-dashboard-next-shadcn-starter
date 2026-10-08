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
  const search = sp.get('search');
  const sort = sp.get('sort') ?? '-updated';

  try {
    const pb = await ensurePbAuth();

    let filter = 'org_id = {:orgId}';
    const filterParams: Record<string, string> = { orgId };
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

    const response: ContactsResponse = {
      items: resultList.items as unknown as Contact[],
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
  const { orgId } = guard.ctx;

  try {
    const body = (await request.json()) as ContactMutationPayload;
    const pb = await ensurePbAuth();

    const record = await pb.collection('contacts').create({
      ...body,
      org_id: orgId,
      status: body.status ?? 'ny'
    });

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Kontakten kunde inte skapas.' }, { status: 502 });
  }
}