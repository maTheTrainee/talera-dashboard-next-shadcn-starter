/**
 * Talera Clerk roles — the operator role bundles (svenska visningsnamn som
 * beskriver VAD personen får). Idempotent: existing roles are skipped.
 * Run: bun scripts/clerk-roles.ts (uses CLERK_SECRET_KEY — dev instance).
 *
 * Rollerna är etiketter som appen läser (ROLE_GRANTS i src/lib/access.ts) —
 * de bär inga Clerk-permissions: operatörer kan inte bjuda in/hantera orgen,
 * det är admin (org:admin) som ger ut rollerna i Team-hanteringen.
 */

const CLERK_API = 'https://api.clerk.com/v1';

const ROLES = [
  { key: 'org:op_utgaende', name: 'Utgående samtal — ringkampanjer & prospekt' },
  { key: 'org:op_inkommande', name: 'Inkommande samtal — statistik & historik' },
  { key: 'org:op_ai_assistent', name: 'AI Assistent' },
  {
    key: 'org:op_utgaende_inkommande',
    name: 'Utgående + Inkommande samtal'
  },
  { key: 'org:op_utgaende_ai', name: 'Utgående samtal + AI Assistent' },
  {
    key: 'org:op_inkommande_ai',
    name: 'Inkommande samtal + AI Assistent'
  },
  { key: 'org:op_alla', name: 'Alla funktioner' }
];

async function clerkFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY ?? ''}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });
  return res;
}

async function main() {
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('✖ CLERK_SECRET_KEY saknas i .env.local');
    process.exit(1);
  }

  const listRes = await clerkFetch('/organization_roles');
  if (!listRes.ok) {
    console.error(`✖ Kunde inte lista roller: ${listRes.status}`);
    console.error(await listRes.text());
    process.exit(1);
  }
  const list = (await listRes.json()) as { data: { key: string }[] };
  const existing = new Set(list.data.map((r) => r.key));
  console.log(
    `✓ Clerk-API OK — ${list.data.length} roller finns (${[...existing].join(', ')})`
  );

  for (const role of ROLES) {
    if (existing.has(role.key)) {
      console.log(`• ${role.key} finns redan — hoppar över`);
      continue;
    }
    const res = await clerkFetch('/organization_roles', {
      method: 'POST',
      body: JSON.stringify({ key: role.key, name: role.name })
    });
    if (res.ok) {
      console.log(`✓ Skapade ${role.key} — "${role.name}"`);
    } else {
      const body = await res.text();
      console.error(`✖ ${role.key}: ${res.status}`);
      console.error(body);
    }
  }

  console.log('');
  console.log('✓ KLAR — rollbuntarna provisionerade.');
  console.log('  Org-admin ger ut dem i Team-hanteringen (inbjudan → roll).');
}

await main();

export {};
