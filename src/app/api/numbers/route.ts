import { NextResponse } from 'next/server';
import { requireAuthContext } from '@/lib/api-auth';
import { ensurePbAuth } from '@/lib/pb';
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

  try {
    const pb = await ensurePbAuth();
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