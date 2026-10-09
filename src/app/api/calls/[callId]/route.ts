import { NextRequest, NextResponse } from 'next/server';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth } from '@/lib/pb';
import type { CampaignCall } from '@/features/campaigns/api/types';

// ============================================================
// Call detail — Clerk firewall. Feeds the Chat Transcript popup modal and the
// /dashboard/chat?callId=[ID] deep links. Tenant isolation: the record's
// clerk_org_id must match the verified orgId.
// ============================================================

type RouteContext = { params: Promise<{ callId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;
  const { callId } = await params;

  try {
    const pb = await ensurePbAuth();
    const record = await pb.collection('calls').getOne(callId);

    if (record.clerk_org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(record as unknown as CampaignCall);
  } catch {
    return NextResponse.json({ error: 'Samtalet hittades inte.' }, { status: 502 });
  }
}