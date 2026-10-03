// ============================================================
// Route Handler — Leads/Prospects (list + create)
// ============================================================
// SECURE: Uses Clerk auth() to enforce organization isolation
// ============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getLeads, createLead } from '@/features/users/api/service';
import type { LeadFilters } from '@/features/users/api/types';

export async function GET(request: NextRequest) {
  // 🔒 SECURE: Get organization from Clerk auth
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation' },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const status = searchParams.get('status') ?? undefined;
  const campaignType = searchParams.get('campaignType') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  // 🔒 SECURE: Pass orgId to service for organization-level filtering
  const filters: LeadFilters = {
    page,
    limit,
    ...(search && { search }),
    ...(status && { status: status as LeadFilters['status'] }),
    ...(campaignType && { campaignType: campaignType as 'outbound' | 'inbound' }),
    ...(sort && { sort }),
    organizationId: orgId // 🔒 SECURE: Always filter by org
  };

  const data = await getLeads(filters);

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation' },
      { status: 401 }
    );
  }

  const body = await request.json();

  // 🔒 SECURE: Add orgId to lead data
  const leadData = {
    ...body,
    organizationId: orgId
  };

  const data = await createLead(leadData);
  return NextResponse.json(data, { status: 201 });
}
