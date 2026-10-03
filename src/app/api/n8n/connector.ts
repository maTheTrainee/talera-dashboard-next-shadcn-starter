// n8n API Connector
// Handles communication with n8n for campaign triggers, webhooks, and workflow management

import type { CampaignMutationPayload, QuickDialPayload } from '@/features/campaigns/api/types';
import { getOrganizationVoiceConfig, isProviderConfigured } from '@/features/admin/api/service';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.yourdomain.com';
const N8N_API_KEY = process.env.N8N_API_KEY;

interface N8NWorkflowTriggerResponse {
  success: boolean;
  executionId?: string;
  message: string;
}

interface N8NWebhookPayload {
  organizationId: string;
  campaignId?: string;
  type: 'campaign_trigger' | 'quick_dial' | 'call_status' | 'call_completed';
  payload: Record<string, unknown>;
  timestamp: string;
}

export async function triggerN8NCampaign(
  organizationId: string,
  campaignData: CampaignMutationPayload
): Promise<N8NWorkflowTriggerResponse> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'n8n')) {
    return { success: false, message: 'n8n inte konfigurerat för denna organisation' };
  }

  const webhookUrl = config.n8n.webhookUrl || `${config.n8n.baseUrl}/webhook/campaign-trigger`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.n8n.apiKey}`,
        'X-Organization-ID': organizationId
      },
      body: JSON.stringify({
        type: 'campaign_trigger',
        campaign: campaignData,
        organizationId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `n8n error: ${error}` };
    }

    const data = await response.json();
    return {
      success: true,
      executionId: data.executionId,
      message: 'Kampanj skickad till n8n'
    };
  } catch (error) {
    return {
      success: false,
      message: `n8n connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function triggerN8NQuickDial(
  organizationId: string,
  dialData: QuickDialPayload
): Promise<N8NWorkflowTriggerResponse> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'n8n')) {
    return { success: false, message: 'n8n inte konfigurerat för denna organisation' };
  }

  const webhookUrl = config.n8n.webhookUrl || `${config.n8n.baseUrl}/webhook/quick-dial`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.n8n.apiKey}`,
        'X-Organization-ID': organizationId
      },
      body: JSON.stringify({
        type: 'quick_dial',
        dial: dialData,
        organizationId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `n8n error: ${error}` };
    }

    const data = await response.json();
    return {
      success: true,
      executionId: data.executionId,
      message: 'Snabbtest skickat till n8n'
    };
  } catch (error) {
    return {
      success: false,
      message: `n8n connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function sendCallStatusToN8N(
  organizationId: string,
  callId: string,
  status: 'ringing' | 'connected' | 'completed' | 'failed',
  metadata?: Record<string, unknown>
): Promise<void> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'n8n')) return;

  const webhookUrl = config.n8n.webhookUrl || `${config.n8n.baseUrl}/webhook/call-status`;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.n8n.apiKey}`,
        'X-Organization-ID': organizationId
      },
      body: JSON.stringify({
        type: 'call_status',
        callId,
        status,
        metadata,
        organizationId,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to send call status to n8n:', error);
  }
}

export async function testN8NConnection(
  organizationId: string
): Promise<{ success: boolean; message: string }> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'n8n')) {
    return { success: false, message: 'n8n inte konfigurerat' };
  }

  try {
    const response = await fetch(`${config.n8n.baseUrl}/healthz`, {
      headers: {
        Authorization: `Bearer ${config.n8n.apiKey}`
      }
    });

    if (response.ok) {
      return { success: true, message: 'n8n anslutning OK' };
    }

    return { success: false, message: `n8n svarade med status: ${response.status}` };
  } catch {
    return { success: false, message: 'Kunde inte ansluta till n8n' };
  }
}
