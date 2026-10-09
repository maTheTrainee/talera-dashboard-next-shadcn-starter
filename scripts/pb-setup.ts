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

// 0. agents — the uv voice agents per tenant (registered once by admins after
// creating them in the engine; n8n may sync them later). The dashboard never
// shows raw IDs — campaigns resolve agents by name.
const agents = await ensureCollection({
  name: 'agents',
  type: 'base',
  ...rules,
  fields: [
    { name: 'clerk_org_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'uv_agent_id', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'active', type: 'bool' }
  ],
  indexes: ['CREATE INDEX idx_agents_clerk_org ON agents (clerk_org_id)']
});
void agents;

// 1. campaigns — dialing campaigns with the anti-spam policy cap
const campaigns = await ensureCollection({
  name: 'campaigns',
  type: 'base',
  ...rules,
  fields: [
    // Clerk identifiers — the tenant key + audit trail, stamped server-side
    // by the /api/* firewall from the verified session (never the payload).
    { name: 'clerk_org_id', type: 'text', required: true },
    { name: 'created_by', type: 'text' },
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
  indexes: ['CREATE INDEX idx_campaigns_clerk_org ON campaigns (clerk_org_id, created)']
});

// 2. contacts — prospects + follow-up scheduling + contact counters
const contacts = await ensureCollection({
  name: 'contacts',
  type: 'base',
  ...rules,
  fields: [
    // clerk_org_id = tenant key · created_by = the Clerk user who made the
    // input. org_number below = the LEAD's Swedish organisationsnummer —
    // business data, never a tenant key. These NEVER mix.
    { name: 'clerk_org_id', type: 'text', required: true },
    { name: 'created_by', type: 'text' },
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
    { name: 'call_summary', type: 'text' },
    { name: 'follow_up_at', type: 'date' },
    { name: 'contact_attempts', type: 'number', min: 0 },
    { name: 'last_contacted_at', type: 'date' },
    { name: 'last_conversation_at', type: 'date' },
    { name: 'created', type: 'autodate', onCreate: true },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
  ],
  indexes: ['CREATE INDEX idx_contacts_clerk_org ON contacts (clerk_org_id, updated)']
});

// 3. calls — call history with engine call ids + transcripts
await ensureCollection({
  name: 'calls',
  type: 'base',
  ...rules,
  fields: [
    { name: 'clerk_org_id', type: 'text', required: true },
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
  indexes: ['CREATE INDEX idx_calls_clerk_org ON calls (clerk_org_id, created)']
});

// 4. usage_daily — daily minute quotas + overage liability
await ensureCollection({
  name: 'usage_daily',
  type: 'base',
  ...rules,
  fields: [
    { name: 'clerk_org_id', type: 'text', required: true },
    { name: 'date', type: 'text', required: true },
    { name: 'minutes_used', type: 'number', min: 0 },
    { name: 'overage_minutes', type: 'number', min: 0 },
    { name: 'created', type: 'autodate', onCreate: true },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
  ],
  indexes: ['CREATE UNIQUE INDEX idx_usage_clerk_org_date ON usage_daily (clerk_org_id, date)']
});

// 5. Extend users (auth collection) — append missing fields only.
const users = await pb.collections.getOne('users');
const existing = new Set(users.fields.map((f: { name: string }) => f.name));
const additions = [
  { name: 'clerk_org_id', type: 'text' },
  {
    name: 'subscription_tier',
    type: 'select',
    maxSelect: 7,
    values: [
      'DELTID',
      'HELTID',
      'TEAM',
      'ENTERPRISE',
      'RECEPTIONIST',
      'RECEPTIONIST_BOOKER',
      'AI_ASSISTENT'
    ]
  },
  { name: 'pb_container_id', type: 'text' },
  { name: 'company_org_number', type: 'text' }
].filter((f) => !existing.has(f.name));

if (additions.length > 0) {
  await pb.collections.update('users', { fields: [...users.fields, ...additions] });
  console.log(`✓ users utökad: ${additions.map((f) => f.name).join(', ')}`);
} else {
  console.log('• users redan utökad — hoppar över');
}

// 6. Sync the subscription_tier field (adds the inbound packages + makes it
// multi-select so one tenant can hold several packages).
const tierField = users.fields.find((f: { name: string }) => f.name === 'subscription_tier');
const wantedTiers = [
  'DELTID',
  'HELTID',
  'TEAM',
  'ENTERPRISE',
  'RECEPTIONIST',
  'RECEPTIONIST_BOOKER',
  'AI_ASSISTENT'
];
if (tierField) {
  const current: string[] = tierField.values ?? [];
  const missing = wantedTiers.filter((v) => !current.includes(v));
  const needsMultiSelect = (tierField.maxSelect ?? 1) < wantedTiers.length;
  if (missing.length > 0 || needsMultiSelect) {
    const updatedFields = users.fields.map((f: { name: string }) =>
      f.name === 'subscription_tier'
        ? { ...f, values: [...current, ...missing], maxSelect: 7 }
        : f
    );
    await pb.collections.update('users', { fields: updatedFields });
    console.log(
      `✓ users.subscription_tier uppdaterad: multi-select${
        missing.length > 0 ? ` + ${missing.join(', ')}` : ''
      }`
    );
  } else {
    console.log('• users.subscription_tier redan uppdaterad');
  }
}

// 7. Sync the contacts fields added after initial provisioning (företagsnamn +
// organisationsnummer) — adds them to a live collection that lacks them.
const contactsCol = await pb.collections.getOne('contacts');
const contactFieldNames = new Set(
  contactsCol.fields.map((f: { name: string }) => f.name)
);
const contactAdditions = [
  { name: 'company', type: 'text' },
  { name: 'org_number', type: 'text' },
  { name: 'call_summary', type: 'text' }
].filter((f) => !contactFieldNames.has(f.name));
if (contactAdditions.length > 0) {
  await pb.collections.update('contacts', {
    fields: [...contactsCol.fields, ...contactAdditions]
  });
  console.log(
    `✓ contacts utökad: ${contactAdditions.map((f) => f.name).join(', ')}`
  );
} else {
  console.log('• contacts.company/org_number finns redan');
}

// 8. calls — sync the call_type field (utgående/inkommande/intern) for the
// unified samtalshistorik across product lines.
const callsCol = await pb.collections.getOne('calls');
const callFieldNames = new Set(callsCol.fields.map((f: { name: string }) => f.name));
if (!callFieldNames.has('call_type')) {
  await pb.collections.update('calls', {
    fields: [
      ...callsCol.fields,
      {
        name: 'call_type',
        type: 'select',
        maxSelect: 1,
        values: ['utgående', 'inkommande', 'intern']
      }
    ]
  });
  console.log('✓ calls utökad: call_type');
} else {
  console.log('• calls.call_type finns redan');
}

// 8. numbers — the tenant's outbound numbers. The campaign UI locks to
// "Använd förvalt nummer" when this collection is empty; n8n holds the
// fallback number for those cases.
await ensureCollection({
  name: 'numbers',
  type: 'base',
  ...rules,
  fields: [
    { name: 'clerk_org_id', type: 'text', required: true },
    { name: 'number', type: 'text', required: true },
    { name: 'label', type: 'text' }
  ],
  indexes: ['CREATE INDEX idx_numbers_clerk_org ON numbers (clerk_org_id)']
});

// ============================================================
// 9. Migrate org_id → clerk_org_id — the two-identifier convention:
//      clerk_*       = Clerk identifiers (tenant key + audit, server-stamped)
//      *_org_number  = Swedish organisationsnummer (business data — leads and
//                      tenant companies) — these NEVER mix.
//    Backfills existing rows from org_id, then drops the old field, flips
//    clerk_org_id to required and recreates the tenant indexes. Idempotent:
//    already-migrated collections are skipped.
// ============================================================
const TENANT_INDEXES: Record<string, string[]> = {
  agents: ['CREATE INDEX idx_agents_clerk_org ON agents (clerk_org_id)'],
  campaigns: [
    'CREATE INDEX idx_campaigns_clerk_org ON campaigns (clerk_org_id, created)'
  ],
  contacts: [
    'CREATE INDEX idx_contacts_clerk_org ON contacts (clerk_org_id, updated)'
  ],
  calls: ['CREATE INDEX idx_calls_clerk_org ON calls (clerk_org_id, created)'],
  usage_daily: [
    'CREATE UNIQUE INDEX idx_usage_clerk_org_date ON usage_daily (clerk_org_id, date)'
  ],
  numbers: ['CREATE INDEX idx_numbers_clerk_org ON numbers (clerk_org_id)']
};

for (const [collectionName, indexes] of Object.entries(TENANT_INDEXES)) {
  try {
    const col = await pb.collections.getOne(collectionName);
    const hasField = (field: string) =>
      (col.fields as { name: string }[]).some((f) => f.name === field);
    if (!hasField('org_id')) {
      console.log(`• ${collectionName}.clerk_org_id redan migrerad — hoppar över`);
      continue;
    }

    // 1. Append clerk_org_id as optional — backfill before the required flip.
    if (!hasField('clerk_org_id')) {
      await pb.collections.update(collectionName, {
        fields: [
          ...(col.fields as { name: string; type: string }[]),
          { name: 'clerk_org_id', type: 'text' }
        ]
      });
    }

    // 2. Backfill every existing row from org_id.
    const rows = await pb.collection(collectionName).getFullList({ batch: 200 });
    for (const row of rows) {
      if (!row.clerk_org_id && row.org_id) {
        await pb.collection(collectionName).update(row.id, {
          clerk_org_id: row.org_id
        });
      }
    }

    // 3. Drop org_id, flip clerk_org_id to required, recreate the indexes.
    const fresh = await pb.collections.getOne(collectionName);
    const migratedFields = fresh.fields
      .filter((f: { name: string }) => f.name !== 'org_id')
      .map((f: { name: string; required?: boolean }) =>
        f.name === 'clerk_org_id' ? { ...f, required: true } : f
      );
    await pb.collections.update(collectionName, {
      fields: migratedFields,
      indexes
    });
    console.log(
      `✓ ${collectionName}: org_id → clerk_org_id (${rows.length} rader backfillade)`
    );
  } catch (error) {
    console.error(`✖ ${collectionName}: migreringen misslyckades`, error);
  }
}

// 10. created_by — the Clerk user id of whoever made the input (audit trail,
// separate from the clerk_org_id ownership key). Stamped server-side by the
// /api/* firewall on POST — never trusted from the browser. Calls and usage
// rows are created by n8n instead: they inherit clerk_org_id from the
// campaign/number row they belong to.
for (const collectionName of ['campaigns', 'contacts']) {
  try {
    const col = await pb.collections.getOne(collectionName);
    if (
      !(col.fields as { name: string }[]).some((f) => f.name === 'created_by')
    ) {
      await pb.collections.update(collectionName, {
        fields: [
          ...(col.fields as { name: string; type: string }[]),
          { name: 'created_by', type: 'text' }
        ]
      });
      console.log(`✓ ${collectionName} utökad: created_by`);
    } else {
      console.log(`• ${collectionName}.created_by finns redan`);
    }
  } catch (error) {
    console.error(
      `✖ ${collectionName}: created_by kunde inte läggas till`,
      error
    );
  }
}

console.log('');
console.log('✓ KLAR — datatabeller + behörigheter (superuser-only) provisionerade.');
console.log(
  '  Nästa steg: skapa din users-rad i admin-UI med clerk_org_id + subscription_tier.'
);
console.log(`  Admin-UI: ${PB_URL}/_/`);