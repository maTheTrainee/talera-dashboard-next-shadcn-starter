/**
 * Talera Clerk org-sanering — tar bort auto-skapade testorganisationer.
 *
 * OrgBootstrap-buggen (workspaces-sidan) skapade en ny organisation per
 * session innan medlemskapslistan hunnit ladda — därför staplas kloner av
 * "Jockes organisation". Scriptet listar orgarna (dry-run) och tar med
 * --apply bort alla UTOM de som behålls (KEEP_ORG_IDS).
 *
 * PocketBase-sidan: för varje borttagen org tas tenant-kontot + orgens
 * kampanjer och kontakter bort (allt testdata).
 *
 * Run:  bun scripts/cleanup-clerk-orgs.ts           # dry-run (listar endast)
 *       bun scripts/cleanup-clerk-orgs.ts --apply   # raderar för hand
 */

const CLERK_API = 'https://api.clerk.com/v1';

/** Orgar som ALDRIG raderas — den riktiga arbetsytan (TEAM + AI_ASSISTENT). */
const KEEP_ORG_IDS = new Set(['org_3KAKCkk6l70nCOhfks9wQPM4uJ8']);

const APPLY = process.argv.includes('--apply');

interface ClerkOrg {
  id: string;
  name: string;
  created_at: number;
  members_count?: number;
}

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

async function listAllOrgs(): Promise<ClerkOrg[]> {
  const orgs: ClerkOrg[] = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const res = await clerkFetch(`/organizations?limit=${limit}&offset=${offset}`);
    if (!res.ok) {
      console.error(`✖ Kunde inte lista organisationer: ${res.status}`);
      console.error(await res.text());
      process.exit(1);
    }
    const page = (await res.json()) as { data: ClerkOrg[]; total_count: number };
    orgs.push(...page.data);
    offset += limit;
    if (offset >= page.total_count) break;
  }
  return orgs;
}

async function memberCount(orgId: string): Promise<number> {
  const res = await clerkFetch(`/organizations/${orgId}/members?limit=1`);
  if (!res.ok) return -1;
  const body = (await res.json()) as { total_count: number };
  return body.total_count ?? 0;
}

async function main() {
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('✖ CLERK_SECRET_KEY saknas i .env.local');
    process.exit(1);
  }
  if (!process.env.PB_ADMIN_EMAIL || !process.env.PB_ADMIN_PASSWORD) {
    console.error('✖ PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD saknas i .env.local');
    process.exit(1);
  }

  const { default: PocketBase } = await import('pocketbase');
  const PB_URL =
    process.env.PB_URL_OVERRIDE ??
    (process.env.NODE_ENV === 'production'
      ? 'http://pocketbase:8080'
      : 'http://kallare-server.tailbf8a69.ts.net:8090');
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb.collection('_superusers').authWithPassword(
    process.env.PB_ADMIN_EMAIL,
    process.env.PB_ADMIN_PASSWORD
  );
  console.log(`✓ PocketBase OK (${PB_URL})`);

  const orgs = await listAllOrgs();
  const keep = orgs.filter((o) => KEEP_ORG_IDS.has(o.id));
  const remove = orgs.filter((o) => !KEEP_ORG_IDS.has(o.id));

  console.log('');
  console.log(`=== Clerk: ${orgs.length} organisationer (${keep.length} behålls) ===`);
  for (const org of keep) {
    console.log(`  BEHÅLL  ${org.id}  "${org.name}"`);
  }
  console.log('');
  console.log(
    `=== ${remove.length} organisationer ${APPLY ? 'RADERAS' : 'råderas (dry-run)'} ===`
  );
  for (const org of remove) {
    const members = await memberCount(org.id);
    const [contacts, campaigns, users] = await Promise.all(
      (['contacts', 'campaigns', 'users'] as const).map(async (collection) => {
        try {
          return await pb.collection(collection).getFullList(200, {
            filter: pb.filter('clerk_org_id = {:org}', { org: org.id })
          });
        } catch {
          return [];
        }
      })
    );
    console.log(
      `  ${APPLY ? 'RADERAR' : 'DRY-RUN'}  ${org.id}  "${org.name}"  · ${members} medlem · ${contacts.length} kontakter · ${campaigns.length} kampanjer · ${users.length} tenant-konton · skapad ${new Date(org.created_at).toLocaleDateString('sv-SE')}`
    );
    if (!APPLY) continue;

    // PB först (testdata + tenant-konto), sen Clerk-organisationen.
    for (const [collection, items] of [
      ['contacts', contacts],
      ['campaigns', campaigns],
      ['users', users]
    ] as const) {
      for (const item of items) {
        await pb.collection(collection).delete(item.id);
      }
    }
    const delRes = await clerkFetch(`/organizations/${org.id}`, { method: 'DELETE' });
    if (!delRes.ok) {
      console.error(`  ✖ Clerk-radering misslyckades för ${org.id}: ${delRes.status}`);
    }
  }

  console.log('');
  if (APPLY) {
    console.log(`✓ KLAR — ${remove.length} organisationer + deras PB-data borttagna.`);
  } else {
    console.log('ℹ DRY-RUN — inget raderat. Kör med --apply för att genomföra.');
  }
}

await main();

export {};
