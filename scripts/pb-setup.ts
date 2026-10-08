/**
 * Talera PocketBase provisioning — datatables + permissions.
 * Idempotent: existing collections are skipped, missing users fields appended.
 * All rules null = SUPERUSER-ONLY (browser never touches PocketBase — all
 * access flows through the Next.js Clerk firewall or n8n's admin node).
 * Run: bun scripts/pb-setup.ts
 */
import PocketBase from 'pocketbase';

const PB_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://pocketbase:8080'
    : 'http://kallare-server:8090';

const email = process.env.PB_ADMIN_EMAIL ?? '';
const password = process.env.PB_ADMIN_PASSWORD ?? '';
if (!email || !password) {
  console.error('✖ PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD saknas i .env.local');
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

try {
  await pb.collection('_superusers').authWithPassword(email, password);
  console.log(`✓ Superuser auth OK (${PB_URL})`);
} catch {
  console.error(
    '✖ Superuser-inloggningen misslyckades — kontrollera PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD'
  );
  process.exit(1);
}

async function ensureCollection(def: Record<string, unknown>) {
  const name = def.name as string;
  try {
    await pb.collections.getOne(name);
    console.log(`• ${name} finns redan — hoppar över`);
  } catch {
    await pb.collections.create(def);
    console.log(`✓ Skapade ${name} (superuser-only regler)`);
  }
  return pb.collections.getOne(name);
}

const rules = {
  listRule: null,
  viewRule: null,
  createRule: null,
  updateRule: null,
  deleteRule: null
};

// 1. campaigns — dialing campaigns with the anti-spam policy cap
const campaigns = await ensureCollection({
  name: 'campaigns',
  type: 'base',
  ...rules,
  fields: [
    { name: 'org_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text' },
    {
      name: 'status',
      type: 'select',
      required: true,
      maxSelect: 1,
      values: ['köad', 'live', 'pausad', 'avslutad']
    },
    { name: 'scheduled_start', type: 'text' },
    { name: 'scheduled_end', type: 'text' },
    { name: 'uv_agent_id', type: 'text' },
    { name: 'outbound_number', type: 'text' },
    { name: 'max_attempts', type: 'number', min: 0 },
    { name: 'created', type: 'autodate', onCreate: true },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
  ],
  indexes: ['CREATE INDEX idx_campaigns_org ON campaigns (org_id, created)']
});

// 2. contacts — prospects + follow-up scheduling + contact counters
const contacts = await ensureCollection({
  name: 'contacts',
  type: 'base',
  ...rules,
  fields: [
    { name: 'org_id', type: 'text', required: true },
    {
      name: 'campaign',
      type: 'relation',
      collectionId: campaigns.id,
      cascadeDelete: false,
      maxSelect: 1
    },
    { name: 'call_id', type: 'text' },
    { name: 'first_name', type: 'text', required: true },
    { name: 'last_name', type: 'text', required: true },
    { name: 'email', type: 'text' },
    { name: 'phone', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      maxSelect: 1,
      values: [
        'ny',
        'i_ko',
        'ringer',
        'i_samtal',
        'avslutat',
        'ej_svar',
        'uppföljning',
        'max_försök'
      ]
    },
    { name: 'call_outcome', type: 'text' },
    { name: 'follow_up_at', type: 'date' },
    { name: 'contact_attempts', type: 'number', min: 0 },
    { name: 'last_contacted_at', type: 'date' },
    { name: 'last_conversation_at', type: 'date' },
    { name: 'created', type: 'autodate', onCreate: true },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
  ],
  indexes: ['CREATE INDEX idx_contacts_org ON contacts (org_id, updated)']
});

// 3. calls — call history with engine call ids + transcripts
await ensureCollection({
  name: 'calls',
  type: 'base',
  ...rules,
  fields: [
    { name: 'org_id', type: 'text', required: true },
    {
      name: 'campaign',
      type: 'relation',
      collectionId: campaigns.id,
      cascadeDelete: false,
      maxSelect: 1
    },
    {
      name: 'prospect',
      type: 'relation',
      collectionId: contacts.id,
      cascadeDelete: false,
      maxSelect: 1
    },
    { name: 'call_id', type: 'text', required: true },
    { name: 'status', type: 'text' },
    { name: 'outcome', type: 'text' },
    { name: 'summary', type: 'text' },
    { name: 'duration_seconds', type: 'number', min: 0 },
    { name: 'transcript', type: 'json' },
    { name: 'created', type: 'autodate', onCreate: true },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
  ],
  indexes: ['CREATE INDEX idx_calls_org ON calls (org_id, created)']
});

// 4. usage_daily — daily minute quotas + overage liability
await ensureCollection({
  name: 'usage_daily',
  type: 'base',
  ...rules,
  fields: [
    { name: 'org_id', type: 'text', required: true },
    { name: 'date', type: 'text', required: true },
    { name: 'minutes_used', type: 'number', min: 0 },
    { name: 'overage_minutes', type: 'number', min: 0 },
    { name: 'created', type: 'autodate', onCreate: true },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
  ],
  indexes: ['CREATE UNIQUE INDEX idx_usage_org_date ON usage_daily (org_id, date)']
});

// 5. Extend users (auth collection) — append missing fields only.
const users = await pb.collections.getOne('users');
const existing = new Set(users.fields.map((f: { name: string }) => f.name));
const additions = [
  { name: 'clerk_org_id', type: 'text' },
  {
    name: 'subscription_tier',
    type: 'select',
    maxSelect: 1,
    values: ['DELTID', 'HELTID', 'TEAM', 'ENTERPRISE']
  },
  { name: 'pb_container_id', type: 'text' }
].filter((f) => !existing.has(f.name));

if (additions.length > 0) {
  await pb.collections.update('users', { fields: [...users.fields, ...additions] });
  console.log(`✓ users utökad: ${additions.map((f) => f.name).join(', ')}`);
} else {
  console.log('• users redan utökad — hoppar över');
}

console.log('');
console.log('✓ KLAR — datatabeller + behörigheter (superuser-only) provisionerade.');
console.log('  Nästa steg: skapa din users-rad i admin-UI med clerk_org_id + subscription_tier.');
console.log(`  Admin-UI: ${PB_URL}/_/`);