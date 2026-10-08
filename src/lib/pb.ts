import PocketBase from 'pocketbase';
import { getTierDefinition } from '@/config/plans';
import type { TenantMetadata } from '@/types/tenant';

/**
 * PocketBase server client — THE READ/WRITE HIGHWAY.
 *
 * Server-only singleton: this module must be imported exclusively from
 * `/api/*` route handlers (never from client components). The React frontend
 * reaches PocketBase only through the Clerk-gated route firewall, and every
 * query is filtered by the verified orgId so tenants cannot cross-pollinate.
 *
 * Network environment gateways (no override logic — strict env switch):
 * - DEVELOPMENT (NODE_ENV !== 'production'): secure Tailscale MagicDNS bridge.
 * - PRODUCTION  (NODE_ENV === 'production'): Coolify internal Docker network.
 */
const PB_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://pocketbase:8080'
    : 'http://kallare-server:8080';

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
 * Reads the tenant's subscription tier from the PocketBase `users` collection
 * (native metadata storage — one row per dashboard user, carrying
 * `clerk_org_id`, `subscription_tier` and `pb_container_id`).
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
    const tier = (row?.subscription_tier as string | undefined) ?? 'DELTID';
    return {
      orgId,
      subscription_tier: getTierDefinition(tier).tier,
      pocketbase_container:
        (row?.pb_container_id as string | undefined) ??
        process.env.POCKETBASE_CONTAINER_ID ??
        'pocketbase'
    };
  } catch {
    return {
      orgId,
      subscription_tier: 'DELTID',
      pocketbase_container: process.env.POCKETBASE_CONTAINER_ID ?? 'pocketbase'
    };
  }
}