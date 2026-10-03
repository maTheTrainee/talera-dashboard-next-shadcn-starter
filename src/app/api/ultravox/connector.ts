// Ultravox API Connector
// Handles WebSocket connections, call creation, and real-time streaming with Ultravox
// Note: All agent prompts and AI configuration is managed in Ultravox via n8n workflows
// This connector only handles the connection infrastructure

import { getOrganizationVoiceConfig, isProviderConfigured } from '@/features/admin/api/service';

const ULTRAVOX_BASE_URL = 'https://api.ultravox.ai';

export interface UltravoxCallRequest {
  systemPrompt: string; // Provided by n8n workflow
  voiceId?: string;
  model?: string;
  temperature?: number;
  maxDuration?: number;
  metadata?: Record<string, unknown>;
  firstSpeaker?: 'user' | 'agent';
  joinTimeout?: number;
}

export interface UltravoxCallResponse {
  callId: string;
  joinUrl: string;
  createdAt: string;
}

export interface UltravoxTranscriptMessage {
  type: 'transcript';
  role: 'user' | 'agent';
  medium: 'voice' | 'text';
  text?: string;
  delta?: string;
  final: boolean;
  ordinal: number;
}

export interface UltravoxStateMessage {
  type: 'state';
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
}

export interface UltravoxCallStartedMessage {
  type: 'call_started';
  callId: string;
  joinUrl: string;
}

export type UltravoxServerMessage =
  | UltravoxTranscriptMessage
  | UltravoxStateMessage
  | UltravoxCallStartedMessage;

export type UltravoxClientMessage =
  | { type: 'ping'; timestamp: number }
  | { type: 'hang_up' }
  | { type: 'user_text_message'; text: string; urgency?: 'immediate' | 'soon' | 'later' }
  | { type: 'set_output_medium'; medium: 'voice' | 'text' };

/**
 * Create an outbound call via Ultravox REST API
 * Returns joinUrl for WebSocket connection
 * The systemPrompt is provided by the n8n workflow that manages the agent
 */
export async function createUltravoxCall(
  organizationId: string,
  request: UltravoxCallRequest
): Promise<UltravoxCallResponse> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'ultravox')) {
    throw new Error('Ultravox inte konfigurerat för denna organisation');
  }

  const payload = {
    systemPrompt: request.systemPrompt,
    voiceId: request.voiceId || config.ultravox.defaultVoiceId,
    model: request.model || config.ultravox.defaultModel,
    temperature: request.temperature ?? 0.7,
    maxDuration: request.maxDuration ?? 3600, // 1 hour default
    metadata: request.metadata,
    firstSpeaker: request.firstSpeaker ?? 'agent',
    joinTimeout: request.joinTimeout ?? 30
  };

  const response = await fetch(`${ULTRAVOX_BASE_URL}/api/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.ultravox.apiKey}`,
      'X-Organization-ID': organizationId
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ultravox API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Join an existing call (for inbound calls)
 */
export async function joinUltravoxCall(
  organizationId: string,
  callId: string
): Promise<{ joinUrl: string }> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'ultravox')) {
    throw new Error('Ultravox inte konfigurerat för denna organisation');
  }

  const response = await fetch(`${ULTRAVOX_BASE_URL}/api/calls/${callId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.ultravox.apiKey}`,
      'X-Organization-ID': organizationId
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ultravox join error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * End a call
 */
export async function endUltravoxCall(
  organizationId: string,
  callId: string
): Promise<{ success: boolean }> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'ultravox')) {
    throw new Error('Ultravox inte konfigurerat för denna organisation');
  }

  const response = await fetch(`${ULTRAVOX_BASE_URL}/api/calls/${callId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${config.ultravox.apiKey}`,
      'X-Organization-ID': organizationId
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ultravox end call error: ${response.status} - ${error}`);
  }

  return { success: true };
}

/**
 * Get call details and transcript
 */
export async function getUltravoxCall(
  organizationId: string,
  callId: string
): Promise<{
  callId: string;
  status: string;
  duration?: number;
  transcript?: UltravoxTranscriptMessage[];
  metadata?: Record<string, unknown>;
}> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'ultravox')) {
    throw new Error('Ultravox inte konfigurerat för denna organisation');
  }

  const response = await fetch(`${ULTRAVOX_BASE_URL}/api/calls/${callId}`, {
    headers: {
      Authorization: `Bearer ${config.ultravox.apiKey}`,
      'X-Organization-ID': organizationId
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ultravox get call error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Create WebSocket connection for real-time streaming
 * Usage in client components:
 *   const ws = createUltravoxWebSocket(joinUrl);
 *   ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
 */
export function createUltravoxWebSocket(joinUrl: string): WebSocket {
  const ws = new WebSocket(joinUrl);

  ws.onopen = () => {
    console.log('Ultravox WebSocket connected');
    // Send initial ping
    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
  };

  ws.onerror = (error) => {
    console.error('Ultravox WebSocket error:', error);
  };

  ws.onclose = (event) => {
    console.log('Ultravox WebSocket closed:', event.code, event.reason);
  };

  return ws;
}

/**
 * Send client message to Ultravox via WebSocket
 */
export function sendUltravoxMessage(ws: WebSocket, message: UltravoxClientMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Test Ultravox connection
 */
export async function testUltravoxConnection(
  organizationId: string
): Promise<{ success: boolean; message: string }> {
  const config = await getOrganizationVoiceConfig(organizationId);

  if (!isProviderConfigured(config, 'ultravox')) {
    return { success: false, message: 'Ultravox inte konfigurerat' };
  }

  try {
    const response = await fetch(`${ULTRAVOX_BASE_URL}/api/health`, {
      headers: {
        Authorization: `Bearer ${config.ultravox.apiKey}`
      }
    });

    if (response.ok) {
      return { success: true, message: 'Ultravox anslutning OK' };
    }

    return { success: false, message: `Ultravox svarade med status: ${response.status}` };
  } catch {
    return { success: false, message: 'Kunde inte ansluta till Ultravox' };
  }
}
