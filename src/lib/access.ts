import type { NavGroup, NavItem } from '@/types';
import type { AccessArea } from '@/types';
import { getCapabilities } from '@/config/plans';
import type { SubscriptionTier } from '@/types/tenant';

/**
 * The three-tier access model — ROLES ∩ PACKAGES.
 *
 * Nivå 1 — Clerk: vem är du, vilken org, vilken roll (org:admin / org:op_*).
 * Nivå 2 — App-grinden: requireArea() → fysiska 403:er per route.
 * Nivå 3 — PB tenant-konton: databasen vägrar själv främmande orgs rader.
 *
 * Synlighet = rollens områden ∩ organisationens paket. Ingen roll — inte ens
 * admin — kan visa mer än orgen äger; paketen är taket för ALLA roller.
 */

export const ROLE_GRANTS: Record<string, AccessArea[]> = {
  'org:admin': ['utgaende', 'inkommande', 'ai_assistent'],
  'org:op_utgaende': ['utgaende'],
  'org:op_inkommande': ['inkommande'],
  'org:op_ai_assistent': ['ai_assistent'],
  'org:op_utgaende_inkommande': ['utgaende', 'inkommande'],
  'org:op_utgaende_ai': ['utgaende', 'ai_assistent'],
  'org:op_inkommande_ai': ['inkommande', 'ai_assistent'],
  'org:op_alla': ['utgaende', 'inkommande', 'ai_assistent'],
  'org:member': []
};

/** The role's granted areas (empty for unknown/no role). */
export function roleGrants(role: string | null | undefined): AccessArea[] {
  if (!role) return [];
  return ROLE_GRANTS[role] ?? [];
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'org:admin';
}

/** The org's packages bound every role — subscription tiers → owned areas. */
export function orgAreas(tiers: string[]): AccessArea[] {
  const caps = getCapabilities(tiers as SubscriptionTier[]);
  const areas: AccessArea[] = [];
  if (caps.outbound) areas.push('utgaende');
  if (caps.inbound) areas.push('inkommande');
  if (caps.internal) areas.push('ai_assistent');
  return areas;
}

function grantsAllowAreas(grants: AccessArea[], areas: AccessArea[]): boolean {
  return areas.some((area) => grants.includes(area));
}

export interface NavAccessContext {
  /** The session's Clerk org role key (org:admin / org:op_*). */
  role?: string | null;
  /** The tenant's subscription tiers (fresh from PB via the server). */
  tiers: string[];
}

/**
 * Server-side nav filter — role ∩ packages. Pure and testable: the layouts
 * compute it per render (always fresh from PocketBase) and hand the filtered
 * groups to the sidebar AND the Cmd+K kbar — hidden = truly invisible.
 */
export function filterNav(
  groups: NavGroup[],
  ctx: NavAccessContext
): NavGroup[] {
  const grants = roleGrants(ctx.role);
  const owned = orgAreas(ctx.tiers);

  const visible = (item: NavItem): boolean => {
    if (item.hidden) return false;
    const access = item.access;
    if (!access) return true; // items without access restrictions = always visible
    if (access.requireOrg && !ctx.role) return false; // no role ⇒ no active org
    const areas = access.areas;
    if (areas && areas.length > 0) {
      // The item requires an operational area: the person must hold it AND
      // the org must own it (packages are the ceiling for every role).
      if (!grantsAllowAreas(grants, areas)) return false;
      if (!grantsAllowAreas(owned, areas)) return false;
    }
    return true;
  };

  return groups
    .map((group) => ({ ...group, items: group.items.filter(visible) }))
    .filter((group) => group.items.length > 0);
}