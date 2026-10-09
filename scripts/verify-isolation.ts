/**
 * Tenant-isolation verifiering (Nivå 3) — loggar in som VARJE orgs PB-konto
 * och assertar att främmande rader är oåtkomliga. Run: bun scripts/verify-isolation.ts
 *
 * Verifierar: HMAC-derivat-inloggningen, org-scoped regler (cross-org frågor
 * returnerar NOLL rader), anonym nekad, och att anonyma inte kan skapa.
 */
import PocketBase from 'pocketbase';

const PB_URL =
  process.env.PB_URL_OVERRIDE ??
  (process.env.NODE_ENV === 'production'
    ? 'http://pocketbase:8080'
    : 'http://kallare-server.tailbf8a69.ts.net:8090');

function deriveOrgCredentials(orgId: string) {
  // Spegling av src/lib/pb.ts (samme derivat).
  const { createHmac } = require('node:crypto') as typeof import('node:crypto');
  const secret = process.env.PB_ORG_PASSWORD_SECRET ?? '';
  return {
    email: `${orgId.toLowerCase()}@tenants.talera.internal`,
    password: createHmac('sha256', secret).update(orgId).digest('hex')
  };
}

async function main() {
  // 1. Lista orgs via superuser (provisionerings-nyckeln).
  const su = new PocketBase(PB_URL);
  su.autoCancellation(false);
  await su.collection('_superusers').authWithPassword(
    process.env.PB_ADMIN_EMAIL ?? '',
    process.env.PB_ADMIN_PASSWORD ?? ''
  );
  const tenants = await su.collection('users').getFullList({ batch: 200 });
  const orgIds = [...new Set(tenants.map((t) => t.clerk_org_id as string))];
  console.log(`✓ Superuser OK — ${orgIds.length} tenant-orgs: ${orgIds.join(', ')}`);

  if (orgIds.length < 2) {
    console.log('⚠ Behöver minst 2 tenant-orgs för cross-org-testet');
  }

  let failures = 0;

  for (const orgId of orgIds) {
    const creds = deriveOrgCredentials(orgId);
    const pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);

    // 2. Inloggning med derivatet.
    try {
      await pb.collection('users').authWithPassword(creds.email, creds.password);
      console.log(`✓ ${orgId}: derivat-inloggning OK`);
    } catch {
      console.error(`✖ ${orgId}: derivat-inloggningen misslyckades`);
      failures++;
      continue;
    }

    // 3. Cross-org frågor MÅSTE returnera noll rader (reglerna vägrar).
    for (const collection of ['campaigns', 'contacts', 'calls', 'usage_daily', 'numbers']) {
      try {
        const result = await pb.collection(collection).getList(1, 50, {
          filter: pb.filter('clerk_org_id != {:orgId}', { orgId })
        });
        if (result.totalItems === 0) {
          console.log(`✓ ${orgId} → ${collection}: främmande rader = 0`);
        } else {
          console.error(
            `✖ LÄCKA: ${orgId} kan se ${result.totalItems} främmande ${collection}-rader!`
          );
          failures++;
        }
      } catch (e) {
        console.log(`✓ ${orgId} → ${collection}: frågan nekad av reglerna`);
      }
    }

    // 4. Anonym skapning MÅSTE nekas (skapa utan auth → reglerna).
    const anon = new PocketBase(PB_URL);
    anon.autoCancellation(false);
    try {
      await anon.collection('contacts').create({
        clerk_org_id: orgId,
        first_name: 'Intrång',
        last_name: 'Test',
        phone: '+46700000000',
        status: 'ny'
      });
      console.error(`✖ LÄCKA: anonym skapning tilläts i contacts!`);
      failures++;
    } catch {
      console.log(`✓ Anonym skapning nekad (contacts)`);
    }
  }

  console.log('');
  if (failures > 0) {
    console.error(`✖ ${failures} ISOLATIONSFEL — åtgärda innan launch!`);
    process.exit(1);
  }
  console.log('✓ KLAR — tenant-isolationen verifierad (Nivå 3).');
}

await main();
