// Admin configuration types - Organization-level Voice AI settings
// Admin controls: Campaign mode, time intervals, provider configuration
// Agent prompts and AI behavior are managed in Ultravox via n8n workflows

export type CampaignMode = 'outbound' | 'inbound' | 'both';

export type VoiceProvider = 'ultravox' | 'vapi' | 'retell';

export type OrganizationVoiceConfig = {
  id: string;
  organizationId: string;

  // Campaign mode control - Admin selects what type of campaigns this org runs
  campaignMode: CampaignMode;
  defaultCampaignType: 'outbound' | 'inbound';

  // Time interval settings for campaigns (admin configurable)
  callSchedule: {
    enabled: boolean;
    timezone: string; // e.g., 'Europe/Stockholm'
    allowedDays: number[]; // 0-6 (Sun-Sat)
    startHour: number; // 0-23
    endHour: number; // 0-23
    excludedDates?: string[]; // ISO date strings for holidays
  };

  // Ultravox configuration (connection only, prompts managed in Ultravox/n8n)
  ultravox: {
    enabled: boolean;
    apiKey?: string; // Admin-managed API key
    baseUrl: string; // e.g., 'https://api.ultravox.ai'
    defaultVoiceId?: string; // Voice selection (optional override)
    defaultModel?: string; // Model selection (optional override)
    webhookSecret?: string; // For n8n callbacks
  };

  // n8n configuration (workflow orchestration)
  n8n: {
    enabled: boolean;
    baseUrl: string; // e.g., 'https://n8n.yourdomain.com'
    apiKey?: string; // n8n API key for triggering workflows
    webhookUrl?: string; // Webhook endpoint for callbacks
    campaignTriggerWorkflowId?: string; // Workflow to trigger campaigns
    quickDialWorkflowId?: string; // Workflow for quick dial
    statusCallbackWorkflowId?: string; // Workflow for call status updates
  };

  // Call limits & billing
  limits: {
    maxConcurrentCalls: number;
    maxDailyMinutes: number;
    maxMonthlyMinutes: number;
    outboundMinuteCost: number; // Cost per minute in SEK
    inboundMinuteCost: number;
  };

  // Feature flags
  features: {
    liveTranscription: boolean;
    aiSummary: boolean;
    callRecording: boolean;
    voicemailDetection: boolean;
    answeringMachineDetection: boolean;
  };

  createdAt: string;
  updatedAt: string;
};

export type AdminOrganizationConfig = OrganizationVoiceConfig & {
  organizationName: string;
  organizationSlug: string;
  memberCount: number;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
};

export type CreateOrganizationConfigPayload = Omit<
  OrganizationVoiceConfig,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateOrganizationConfigPayload = Partial<CreateOrganizationConfigPayload>;
