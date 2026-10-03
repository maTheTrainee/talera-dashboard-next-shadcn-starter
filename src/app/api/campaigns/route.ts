// ============================================================
// Route Handler — Campaigns (list + create)
// ============================================================
// SECURE: Uses Clerk auth() to enforce organization isolation
// ============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, createCampaign, quickDial } from '@/features/campaigns/api/service';
import type { CampaignFilters, CampaignType, Campaign } from '@/features/campaigns/api/types';

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
  const type = searchParams.get('type') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  // 🔒 SECURE: Pass orgId to service for organization-level filtering
  const filters: CampaignFilters = {
    page,
    limit,
    ...(type && { type: type as CampaignType }),
    ...(status && { status: status as Campaign['status'] }),
    ...(search && { search }),
    ...(sort && { sort }),
    organizationId: orgId // 🔒 SECURE: Always filter by org
  };

  const data = await getCampaigns(filters);

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

  // 🔒 SECURE: Add orgId to campaign data
  const campaignData = {
    ...body,
    organizationId: orgId
  };

  const data = await createCampaign(campaignData);
  return NextResponse.json(data, { status: 201 });
}

// Quick dial endpoint
export async function POST_QUICK_DIAL(request: NextRequest) {
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation' },
      { status: 401 }
    );
  }

  const body = await request.json();

  // 🔒 SECURE: Add orgId to dial data
  const dialData = {
    ...body,
    organizationId: orgId
  };

  const data = await quickDial(dialData);
  return NextResponse.json(data);
}
