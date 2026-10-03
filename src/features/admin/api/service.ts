// Admin Configuration Service - Data Access Layer
// This is the ONLY file you modify when connecting to your backend for admin config.

import { delay } from '@/constants/mock-api';
import type {
  OrganizationVoiceConfig,
  AdminOrganizationConfig,
  CreateOrganizationConfigPayload,
  UpdateOrganizationConfigPayload,
  CampaignMode
} from './types';

// Mock storage for admin configs
const mockOrgConfigs: Map<string, OrganizationVoiceConfig> = new Map();

// Initialize with default config
function getDefaultConfig(orgId: string): OrganizationVoiceConfig {
  return {
    id: `config-${orgId}`,
    organizationId: orgId,
    campaignMode: 'outbound',
    defaultCampaignType: 'outbound',
    callSchedule: {
      enabled: true,
      timezone: 'Europe/Stockholm',
      allowedDays: [1, 2, 3, 4, 5], // Mon-Fri
      startHour: 9, // 09:00
      endHour: 17, // 17:00
      excludedDates: []
    },
    ultravox: {
      enabled: true,
      apiKey: process.env.ULTRAVOX_API_KEY || 'uv_admin_key_placeholder',
      baseUrl: 'https://api.ultravox.ai',
      defaultVoiceId: 'voice_1',
      defaultModel: 'ultravox-v1'
    },
    n8n: {
      enabled: true,
      baseUrl: process.env.N8N_BASE_URL || 'https://n8n.yourdomain.com',
      apiKey: process.env.N8N_API_KEY || 'n8n_admin_key_placeholder',
      campaignTriggerWorkflowId: 'workflow_campaign_trigger',
      quickDialWorkflowId: 'workflow_quick_dial',
      statusCallbackWorkflowId: 'workflow_status_callback'
    },
    limits: {
      maxConcurrentCalls: 10,
      maxDailyMinutes: 500,
      maxMonthlyMinutes: 10000,
      outboundMinuteCost: 0.5,
      inboundMinuteCost: 0.3
    },
    features: {
      liveTranscription: true,
      aiSummary: true,
      callRecording: true,
      voicemailDetection: true,
      answeringMachineDetection: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function getConfig(orgId: string): OrganizationVoiceConfig {
  if (!mockOrgConfigs.has(orgId)) {
    mockOrgConfigs.set(orgId, getDefaultConfig(orgId));
  }
  return mockOrgConfigs.get(orgId)!;
}

export async function getOrganizationVoiceConfig(
  organizationId: string
): Promise<OrganizationVoiceConfig> {
  await delay(200);
  return getConfig(organizationId);
}

export async function getAdminOrganizationConfigs(): Promise<AdminOrganizationConfig[]> {
  await delay(300);
  // Return mock admin view with org details
  return [
    {
      ...getConfig('org-1'),
      organizationId: 'org-1',
      organizationName: 'Demo Företag AB',
      organizationSlug: 'demo-foretag',
      memberCount: 12,
      plan: 'pro',
      status: 'active'
    },
    {
      ...getConfig('org-2'),
      organizationId: 'org-2',
      organizationName: 'Test Company',
      organizationSlug: 'test-company',
      memberCount: 5,
      plan: 'free',
      status: 'trial'
    }
  ];
}

export async function createOrganizationVoiceConfig(
  data: CreateOrganizationConfigPayload
): Promise<{ success: boolean; config?: OrganizationVoiceConfig; message: string }> {
  await delay(500);

  const config: OrganizationVoiceConfig = {
    ...data,
    id: `config-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockOrgConfigs.set(data.organizationId, config);

  return { success: true, config, message: 'Konfiguration skapad' };
}

export async function updateOrganizationVoiceConfig(
  organizationId: string,
  data: UpdateOrganizationConfigPayload
): Promise<{ success: boolean; config?: OrganizationVoiceConfig; message: string }> {
  await delay(500);

  const existing = getConfig(organizationId);
  const updated: OrganizationVoiceConfig = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString()
  };

  mockOrgConfigs.set(organizationId, updated);

  return { success: true, config: updated, message: 'Konfiguration uppdaterad' };
}

export async function deleteOrganizationVoiceConfig(
  organizationId: string
): Promise<{ success: boolean; message: string }> {
  await delay(300);
  mockOrgConfigs.delete(organizationId);
  return { success: true, message: 'Konfiguration borttagen' };
}

// Helper: Get effective campaign mode for organization
export function getEffectiveCampaignMode(config: OrganizationVoiceConfig): 'outbound' | 'inbound' {
  if (config.campaignMode === 'outbound') return 'outbound';
  if (config.campaignMode === 'inbound') return 'inbound';
  // 'both' mode defaults to outbound but allows switching
  return config.defaultCampaignType;
}

// Helper: Check if feature is enabled
export function isFeatureEnabled(
  config: OrganizationVoiceConfig,
  feature: keyof OrganizationVoiceConfig['features']
): boolean {
  return config.features[feature] ?? false;
}

// Helper: Check if provider is configured
export function isProviderConfigured(
  config: OrganizationVoiceConfig,
  provider: 'ultravox' | 'n8n'
): boolean {
  const providerConfig = config[provider];
  return providerConfig.enabled && !!providerConfig.apiKey;
}

// Helper: Check if call is allowed at current time
export function isCallAllowedNow(config: OrganizationVoiceConfig): boolean {
  if (!config.callSchedule.enabled) return true;

  const now = new Date();
  const timezone = config.callSchedule.timezone || 'Europe/Stockholm';

  // Convert to org's timezone
  const orgTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const day = orgTime.getDay(); // 0-6
  const hour = orgTime.getHours();
  const dateStr = orgTime.toISOString().split('T')[0];

  // Check day
  if (!config.callSchedule.allowedDays.includes(day)) return false;

  // Check time
  if (hour < config.callSchedule.startHour || hour >= config.callSchedule.endHour) return false;

  // Check excluded dates
  if (config.callSchedule.excludedDates?.includes(dateStr)) return false;

  return true;
}
