/**
 * Tenant metadata + n8n envelope contracts — THE VOICE/AUTOMATION HIGHWAY.
 *
 * The `tenant` block is injected into EVERY payload dispatched to the single
 * background master webhook (POST /webhook/dashboard-api) so the central n8n
 * instance (utilizing its internal `n8n-nodes-pocketbase-admin` node) can route
 * logs dynamically to the correct isolated PocketBase container on the Coolify
 * server and enforce call concurrency limits based on subscription tier.
 */

export type SubscriptionTier = 'DELTID' | 'HELTID' | 'TEAM' | 'ENTERPRISE';

export type N8nAction = 'start.web.session' | 'start.batch.campaign';

export interface TenantMetadata {
  /** Verified Clerk organization id — never taken from client input. */
  orgId: string;
  subscription_tier: SubscriptionTier;
  pocketbase_container: string;
}

export interface N8nEnvelope<TPayload> {
  action: N8nAction;
  tenant: TenantMetadata;
  payload: TPayload;
}

/** Response from n8n for `start.web.session` — a single-use, short-lived WebRTC URL. */
export interface UVSessionResponse {
  joinUrl: string;
}