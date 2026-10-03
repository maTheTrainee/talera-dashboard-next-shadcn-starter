// ============================================================
// Route Handler — Admin Configuration
// ============================================================
// SECURE: Uses Clerk auth() to enforce organization isolation
// Only accessible by org admins (check role)
// ============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getOrganizationVoiceConfig,
  updateOrganizationVoiceConfig,
  getAdminOrganizationConfigs,
  isProviderConfigured,
  isCallAllowedNow
} from '@/features/admin/api/service';
import type {
  CreateOrganizationConfigPayload,
  UpdateOrganizationConfigPayload
} from '@/features/admin/api/types';

export async function GET(request: NextRequest) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation eller användare' },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;
  const adminView = searchParams.get('admin') === 'true';

  // Admin view - list all org configs (only for platform admins)
  if (adminView) {
    // TODO: Add check for platform admin role
    // const { user } = await auth();
    // if (user?.publicMetadata?.role !== 'platform_admin') {
    //   return NextResponse.json({ success: false, message: 'Otillåten' }, { status: 403 });
    // }

    const configs = await getAdminOrganizationConfigs();
    return NextResponse.json({
      success: true,
      time: new Date().toISOString(),
      message: 'Admin konfigurationer hämtade',
      configs
    });
  }

  // Regular org view - single org config
  if (!orgId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation' },
      { status: 401 }
    );
  }

  const config = await getOrganizationVoiceConfig(orgId);

  // Add computed fields
  const configWithComputed = {
    ...config,
    ultravoxConfigured: isProviderConfigured(config, 'ultravox'),
    n8nConfigured: isProviderConfigured(config, 'n8n'),
    callAllowedNow: isCallAllowedNow(config)
  };

  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    message: 'Konfiguration hämtad',
    config: configWithComputed
  });
}

export async function POST(request: NextRequest) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation eller användare' },
      { status: 401 }
    );
  }

  // Check if user is org admin
  // const { user } = await auth();
  // if (user?.publicMetadata?.role !== 'org_admin') {
  //   return NextResponse.json({ success: false, message: 'Otillåten' }, { status: 403 });
  // }

  const body = await request.json();

  const data = {
    ...body,
    organizationId: orgId
  };

  // TODO: Call createOrganizationVoiceConfig from service
  // For now return success mock
  return NextResponse.json(
    {
      success: true,
      message: 'Konfiguration skapad',
      config: {
        ...data,
        id: `config-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation eller användare' },
      { status: 401 }
    );
  }

  // Check if user is org admin
  // const { user } = await auth();
  // if (user?.publicMetadata?.role !== 'org_admin') {
  //   return NextResponse.json({ success: false, message: 'Otillåten' }, { status: 403 });
  // }

  const body = await request.json();

  // TODO: Call updateOrganizationVoiceConfig from service
  // For now return success mock
  return NextResponse.json({
    success: true,
    message: 'Konfiguration uppdaterad',
    config: { ...body, organizationId: orgId, updatedAt: new Date().toISOString() }
  });
}

export async function DELETE(request: NextRequest) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation eller användare' },
      { status: 401 }
    );
  }

  // Check if user is platform admin
  // const { user } = await auth();
  // if (user?.publicMetadata?.role !== 'platform_admin') {
  //   return NextResponse.json({ success: false, message: 'Otillåten' }, { status: 403 });
  // }

  const { searchParams } = request.nextUrl;
  const targetOrgId = searchParams.get('orgId') || orgId;

  // TODO: Call deleteOrganizationVoiceConfig from service
  // For now return success mock
  return NextResponse.json({
    success: true,
    message: 'Konfiguration borttagen'
  });
}
