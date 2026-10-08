import { NextRequest, NextResponse } from 'next/server';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth } from '@/lib/pb';
import type { ContactMutationPayload } from '@/features/contacts/api/types';

// ============================================================
// Contact detail — Clerk firewall. Tenant isolation: the record's org_id
// must match the verified orgId before any mutation.
// ============================================================

type RouteContext = { params: Promise<{ contactId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;
  const { contactId } = await params;

  try {
    const body = (await request.json()) as Partial<ContactMutationPayload>;
    const pb = await ensurePbAuth();

    const record = await pb.collection('contacts').getOne(contactId);
    if (record.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await pb.collection('contacts').update(contactId, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Kontakten kunde inte uppdateras.' }, { status: 502 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;
  const { contactId } = await params;

  try {
    const pb = await ensurePbAuth();

    const record = await pb.collection('contacts').getOne(contactId);
    if (record.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pb.collection('contacts').delete(contactId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kontakten kunde inte tas bort.' }, { status: 502 });
  }
}