import { NextRequest, NextResponse } from 'next/server';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth, getTenantMetadata } from '@/lib/pb';
import { dispatchToN8n } from '@/lib/n8n';
import type { CampaignUpdatePayload } from '@/features/campaigns/api/types';

// ============================================================
// Campaign detail — Clerk firewall. Tenant isolation: the record's org_id
// must match the verified orgId before any read or mutation.
// PATCH → 'live' hands the batch execution to n8n (start.batch.campaign).
// ============================================================

type RouteContext = { params: Promise<{ campaignId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;
  const { campaignId } = await params;

  try {
    const pb = await ensurePbAuth();
    const record = await pb.collection('campaigns').getOne(campaignId);

    if (record.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Kampanjen hittades inte.' }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;
  const { campaignId } = await params;

  try {
    const body = (await request.json()) as CampaignUpdatePayload;
    const pb = await ensurePbAuth();

    const record = await pb.collection('campaigns').getOne(campaignId);
    if (record.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await pb.collection('campaigns').update(campaignId, body);

    // Voice/Automation Highway — going live hands the batch campaign to n8n
    // with the standardized tenant metadata block.
    if (body.status === 'live' && record.status !== 'live') {
      const tenant = await getTenantMetadata(orgId);
      await dispatchToN8n('start.batch.campaign', tenant, {
        campaign_id: campaignId,
        campaign: updated
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Kampanjen kunde inte uppdateras.' }, { status: 502 });
  }
}