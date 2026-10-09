import { createHmac } from 'node:crypto';
import PocketBase from 'pocketbase';
import type { SubscriptionTier, TenantMetadata } from '@/types/tenant';

/**
 * PocketBase server client — THE READ/WRITE HIGHWAY.
 *
 * THREE-TIER ACCESS MODEL (docs/security.md):
 * - The browser NEVER touches PocketBase (API rules are org-scoped or
 *   superuser-only — no anon keys, no client SDK config).
 * - All TENANT DATA queries run as the tenant's own PB account (per-org
 *   client, HMAC-derived password — never the superuser). A forgotten filter
 *   in a route handler returns zero foreign rows because PocketBase itself
 *   refuses them (clerk_org_id = @request.auth.clerk_org_id).
 * - The superuser is used ONLY for tenant-row provisioning (create/normalize)
 *   — never for tenant data queries. n8n keeps the superuser (the dialer loop
 *   is cross-tenant by design).
 *
 * Network environment gateways (no override logic — strict env switch):
 * - DEVELOPMENT (NODE_ENV !== 'production'): Tailscale public port 8090
 *   (humans + Next.js dev both reach PocketBase through it).
 * - PRODUCTION  (NODE_ENV === 'production'): Coolify-internal Docker network
 *   port 8080 — only reachable inside the server's container network.
 */
const PB_URL =
  process.env.PB_URL_OVERRIDE ??
  (process.env.NODE_ENV === 'production'
    ? 'http://pocketbase:8080' // Coolify-internal container port (Docker network)
    : 'http://kallare-server:8090'); // Tailscale public port (dev host)

let pbSingleton: PocketBase | null = null;

export function getPbServer(): PocketBase {
  if (!pbSingleton) {
    pbSingleton = new PocketBase(PB_URL);
    pbSingleton.autoCancellation(false);
  }
  return pbSingleton;
}

/**
 * Superuser — Tier 3 provisioning ONLY: the tenant-row create/normalize in
 * ensurePbOrgAuth's self-healing path, scripts, and emergency admin. NEVER
 * for tenant data queries — those go through ensurePbOrgAuth.
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

// ------------------------------------------------------------------
// Per-org tenant accounts (Tier 3) — the DB-side tenancy lock.
// ------------------------------------------------------------------

const ORG_EMAIL_DOMAIN = 'tenants.talera.internal';

/**
 * Stateless credentials for an org's PB account: the password is
 * HMAC-SHA256(PB_ORG_PASSWORD_SECRET, clerk_org_id) — derived, never stored,
 * always re-derivable. Rotation = bump the secret; the self-healing path
 * re-hashes on the next contact.
 */
export function deriveOrgCredentials(orgId: string): {
  email: string;
  password: string;
} {
  const secret = process.env.PB_ORG_PASSWORD_SECRET ?? '';
  const password = createHmac('sha256', secret).update(orgId).digest('hex');
  return {
    email: `${orgId.toLowerCase()}@${ORG_EMAIL_DOMAIN}`,
    password
  };
}

// Per-org PB clients — one client per org. A shared singleton authStore
// would race between concurrent requests for different orgs.
const orgClients = new Map<string, { pb: PocketBase; expiresAt: number }>();
const ORG_TOKEN_TTL_MS = 55 * 60_000; // PB tokens live ~1h — re-auth at 55 min

/**
 * Authenticates as the TENANT's own PB account (Tier 3). The password is
 * derived from the verified orgId — never stored, never client-supplied.
 *
 * Self-healing + lazy provisioning: if the account is missing (a brand new
 * org's first visit) or its credentials have drifted (secret rotation), the
 * superuser normalizes the row — create with the DELTID default, or update
 * the derived email/password — and the login retries.
 *
 * The returned client is scoped to EXACTLY this org by PocketBase's rules —
 * a route handler cannot leak cross-tenant data even with a missing filter.
 */
export async function ensurePbOrgAuth(orgId: string): Promise<PocketBase> {
  const cached = orgClients.get(orgId);
  if (cached && cached.expiresAt > Date.now()) return cached.pb;

  const creds = deriveOrgCredentials(orgId);
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);

  try {
    await pb.collection('users').authWithPassword(creds.email, creds.password);
  } catch {
    // Self-healing path — superuser, provisioning only (never tenant data).
    const su = await ensurePbAuth();
    const existing = await su.collection('users').getList(1, 1, {
      filter: su.filter('clerk_org_id = {:orgId}', { orgId })
    });
    if (existing.items.length === 0) {
      await su.collection('users').create({
        email: creds.email,
        password: creds.password,
        passwordConfirm: creds.password,
        clerk_org_id: orgId,
        subscription_tier: ['DELTID']
      });
    } else {
      await su.collection('users').update(existing.items[0].id, {
        email: creds.email,
        password: creds.password,
        passwordConfirm: creds.password
      });
    }
    await pb.collection('users').authWithPassword(creds.email, creds.password);
  }

  orgClients.set(orgId, { pb, expiresAt: Date.now() + ORG_TOKEN_TTL_MS });
  for (const [id, entry] of orgClients) {
    if (entry.expiresAt <= Date.now()) orgClients.delete(id);
  }
  return pb;
}

// ------------------------------------------------------------------
// Tenant metadata — auto-provisioned at the org's first contact.
// ------------------------------------------------------------------

let metaCache: {
  orgId: string;
  at: number;
  meta: TenantMetadata;
} | null = null;
const META_CACHE_MS = 5_000; // dedupes the parallel @-route calls per render

/**
 * Reads the tenant's packages from the PocketBase `users` collection (native
 * metadata storage — one row per tenant, carrying `clerk_org_id`,
 * `subscription_tier` (multi-select) and `pb_container_id`), authenticated as
 * the tenant's own PB account (Tier 3).
 *
 * Falls back to DELTID + the primary container when the collection is
 * unreachable or unset, so the dashboard keeps rendering before the PocketBase
 * schema is provisioned.
 */
export async function getTenantMetadata(orgId: string): Promise<TenantMetadata> {
  if (
    metaCache &&
    metaCache.orgId === orgId &&
    Date.now() - metaCache.at < META_CACHE_MS
  ) {
    return metaCache.meta;
  }

  let meta: TenantMetadata;
  try {
    const pb = await ensurePbOrgAuth(orgId);
    const result = await pb.collection('users').getList(1, 1, {
      filter: pb.filter('clerk_org_id = {:orgId}', { orgId })
    });
    const row = result.items[0];
    const rawTiers = row?.subscription_tier as string | string[] | undefined;
    const tiers = (
      Array.isArray(rawTiers) ? rawTiers : rawTiers ? [rawTiers] : ['DELTID']
    ) as SubscriptionTier[];
    meta = {
      orgId,
      subscription_tiers: tiers,
      pocketbase_container:
        (row?.pb_container_id as string | undefined) ??
        process.env.POCKETBASE_CONTAINER_ID ??
        'pocketbase'
    };
  } catch {
    meta = {
      orgId,
      subscription_tiers: ['DELTID'],
      pocketbase_container: process.env.POCKETBASE_CONTAINER_ID ?? 'pocketbase'
    };
  }

  metaCache = { orgId, at: Date.now(), meta };
  return meta;
}