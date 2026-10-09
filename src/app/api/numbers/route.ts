import { NextResponse } from 'next/server';
import { requireOrgAdmin, requireAuthContext } from '@/lib/api-auth';
import { ensurePbOrgAuth } from '@/lib/pb';
import type { TenantNumbersResponse } from '@/features/campaigns/api/types';

// ============================================================
// Tenant numbers — Clerk firewall. The campaign form lists these; when the
// tenant has none the UI locks to "Använd förvalt nummer" and n8n's
// fallback number applies at dial-time.
// ============================================================

export async function GET() {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;

  // Nivå 2 — nummerkonfigurationen är en admin-yta.
  if (!(await requireOrgAdmin(guard.ctx))) {
    return NextResponse.json(
      { error: 'Du saknar behörighet för den här funktionen.' },
      { status: 403 }
    );
  }

  try {
    const pb = await ensurePbOrgAuth(orgId);
    const resultList = await pb.collection('numbers').getList(1, 50, {
      filter: pb.filter('clerk_org_id = {:orgId}', { orgId }),
      sort: 'label'
    });
    const response: TenantNumbersResponse = {
      items: resultList.items as unknown as TenantNumbersResponse['items'],
      total_items: resultList.totalItems
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'PocketBase svarar inte.' }, { status: 502 });
  }
}