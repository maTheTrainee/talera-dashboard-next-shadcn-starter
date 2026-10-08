import type { N8nAction, N8nEnvelope, TenantMetadata } from '@/types/tenant';

/**
 * n8n dispatcher — THE VOICE/AUTOMATION HIGHWAY.
 *
 * Next.js never installs or runs server-side voice SDKs: every engine
 * operation is a plain native fetch POST to the single master webhook
 * (POST /webhook/dashboard-api). The central n8n instance consumes the
 * envelope, drives the voice engine, and writes results back to PocketBase
 * via its native `n8n-nodes-pocketbase-admin` node.
 */
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? '';

export async function dispatchToN8n<TPayload, TResponse = unknown>(
  action: N8nAction,
  tenant: TenantMetadata,
  payload: TPayload
): Promise<TResponse> {
  const envelope: N8nEnvelope<TPayload> = { action, tenant, payload };

  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Talera-Secret': process.env.N8N_WEBHOOK_SECRET ?? ''
    },
    body: JSON.stringify(envelope),
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`n8n dispatch failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as TResponse;
}