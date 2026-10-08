import PocketBase from 'pocketbase';
import type { SubscriptionTier, TenantMetadata } from '@/types/tenant';

/**
 * PocketBase server client — THE READ/WRITE HIGHWAY.
 *
 * Server-only singleton: this module must be imported exclusively from
 * `/api/*` route handlers (never from client components). The React frontend
 * reaches PocketBase only through the Clerk-gated route firewall, and every
 * query is filtered by the verified orgId so tenants cannot cross-pollinate.
 *
 * Network environment gateways (no override logic — strict env switch):
 * - DEVELOPMENT (NODE_ENV !== 'production'): Tailscale public port 8090
 *   (humans + Next.js dev both reach PocketBase through it).
 * - PRODUCTION  (NODE_ENV === 'production'): Coolify-internal Docker network
 *   port 8080 — only reachable inside the server's container network.
 */
const PB_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://pocketbase:8080' // Coolify-internal container port (Docker network)
    : 'http://kallare-server:8090'; // Tailscale public port (dev host)

let pbSingleton: PocketBase | null = null;

export function getPbServer(): PocketBase {
  if (!pbSingleton) {
    pbSingleton = new PocketBase(PB_URL);
    pbSingleton.autoCancellation(false);
  }
  return pbSingleton;
}

/**
 * Authenticates the server-side service account (superuser) once per process
 * lifetime; re-authenticates when the stored token expires.
 */
export async function ensurePbAuth(): Promise<PocketBase> {
  const pb = getPbServer();
  if (!pb.authStore.isValid) {
    await pb
      .collection('_superusers')
      .authWithPassword(
        process.env.PB_ADMIN_EMAIL ?? '',
        process.env.PB_ADMIN_PASSWORD ?? ''
      );
  }
  return pb;
}

/**
 * Reads the tenant's packages from the PocketBase `users` collection (native
 * metadata storage — one row per tenant, carrying `clerk_org_id`,
 * `subscription_tier` (multi-select) and `pb_container_id`).
 *
 * Falls back to DELTID + the primary container when the collection is
 * unreachable or unset, so the dashboard keeps rendering before the PocketBase
 * schema is provisioned.
 */
export async function getTenantMetadata(orgId: string): Promise<TenantMetadata> {
  try {
    const pb = await ensurePbAuth();
    const result = await pb.collection('users').getList(1, 1, {
      filter: pb.filter('clerk_org_id = {:orgId}', { orgId })
    });
    const row = result.items[0];
    const rawTiers = row?.subscription_tier as string | string[] | undefined;
    const tiers = (
      Array.isArray(rawTiers) ? rawTiers : rawTiers ? [rawTiers] : ['DELTID']
    ) as SubscriptionTier[];
    return {
      orgId,
      subscription_tiers: tiers,
      pocketbase_container:
        (row?.pb_container_id as string | undefined) ??
        process.env.POCKETBASE_CONTAINER_ID ??
        'pocketbase'
    };
  } catch {
    return {
      orgId,
      subscription_tiers: ['DELTID'],
      pocketbase_container: process.env.POCKETBASE_CONTAINER_ID ?? 'pocketbase'
    };
  }
}