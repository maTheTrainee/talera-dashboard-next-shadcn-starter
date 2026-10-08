# PocketBase Schema — Talera Collections

Provisioned by `bun scripts/pb-setup.ts` (idempotent — safe to re-run; also
reusable against the prod container). The Next.js server singleton
(`src/lib/pb.ts`) and the n8n `n8n-nodes-pocketbase-admin` node both operate
on these shapes.

## Permission model (deliberate — the security contract at the DB layer)

All five API rules (`listRule` / `viewRule` / `createRule` / `updateRule` /
`deleteRule`) on the new collections are **null = SUPERUSER-ONLY**. The browser
structurally cannot reach PocketBase. The only two writers:

1. **Next.js `/api/*` Clerk firewall** — superuser SDK, every query filtered by
   the verified `orgId` (the Read/Write Highway).
2. **n8n pocketbase-admin node** — superuser (the Voice/Automation Highway).

The `users` auth collection keeps its own auth rules untouched (schema
extension only).

## Network ports

- **8090** — Tailscale public port (humans via `/_/` admin UI + Next.js dev)
- **8080** — Coolify-internal container port (production `http://pocketbase:8080`)

## `users` (built-in auth collection — extended)
| Field | Type | Notes |
|---|---|---|
| `clerk_org_id` | text | Links the dashboard user to the Clerk organization |
| `subscription_tier` | select | `DELTID` / `HELTID` / `TEAM` / `ENTERPRISE` |
| `pb_container_id` | text | Optional — per-tenant container override for n8n routing |

## `campaigns`
| Field | Type | Notes |
|---|---|---|
| `org_id` | text (req) | Tenant isolation key — every query filters on this |
| `name` | text (req) | |
| `description` | text | |
| `status` | select (req) | `köad` / `live` / `pausad` / `avslutat` |
| `scheduled_start` | text (ISO) | ≥ 4h window enforced by Zod |
| `scheduled_end` | text (ISO) | |
| `uv_agent_id` | text | Voice agent identifier |
| `outbound_number` | text | E.164 (07X ➔ +467X cleaned on input) |
| `max_attempts` | number ≥0 | Anti-spam cap — engine stops dialing at this many attempts without a booked follow-up. 0 = unlimited (default 3) |
| `created` / `updated` | autodate | PB 0.23+ explicit autodate fields |

## `contacts` (Kontaktlistor / prospects)
| Field | Type | Notes |
|---|---|---|
| `org_id` | text (req) | Tenant isolation key |
| `campaign` | relation → campaigns | Optional — locks the prospect into a campaign |
| `call_id` | text | Engine call id (uv) written back by n8n after each call |
| `first_name` / `last_name` | text (req) | |
| `email` / `phone` | text | Phone stored E.164 (`phone` req) |
| `status` | select (req) | `ny` / `i_ko` / `ringer` / `i_samtal` / `avslutat` / `ej_svar` / **`uppföljning`** / **`max_försök`** |
| `call_outcome` | text | Written by n8n post-call |
| `follow_up_at` | date | "Uppföljning 2026-05-03 15:30" — when the agent will call back |
| `contact_attempts` | number ≥0 | Every dial attempt (n8n-maintained, read-only from the app) |
| `last_contacted_at` | date | Any attempt |
| `last_conversation_at` | date | Actual conversation only |
| `created` / `updated` | autodate | |

## `calls` (Samtalshistorik / transcripts)
| Field | Type | Notes |
|---|---|---|
| `org_id` | text (req) | Tenant isolation key |
| `campaign` | relation → campaigns | |
| `prospect` | relation → contacts | |
| `call_id` | text (req) | **Engine call id — n8n writes it from the call lifecycle webhook**; join key for transcripts + `?callId=` deep links |
| `status` | text | Live cycle state |
| `outcome` / `summary` | text | n8n-generated post-call summary |
| `duration_seconds` | number ≥0 | Feeds daily minute accounting |
| `transcript` | json | `[{ text, speaker: 'user' \| 'agent', isFinal }]` |
| `created` / `updated` | autodate | |

## `usage_daily`
| Field | Type | Notes |
|---|---|---|
| `org_id` | text (req) | Tenant isolation key |
| `date` | text (req) | `YYYY-MM-DD` |
| `minutes_used` | number ≥0 | Aggregate call minutes for the day |
| `overage_minutes` | number ≥0 | Minutes beyond the tier daily limit (n8n-tracked) |
| `created` / `updated` | autodate | Unique index on `(org_id, date)` |

## n8n tenant metadata envelope
Every dispatch from Next.js to `POST /webhook/dashboard-api` carries:

```json
{
  "action": "start.web.session | start.batch.campaign",
  "tenant": {
    "orgId": "[clerk_org_id]",
    "subscription_tier": "DELTID | HELTID | TEAM | ENTERPRISE",
    "pocketbase_container": "pocketbase-4g2oakxp5wxj1ovct1bjprmw"
  },
  "payload": { }
}
```

## n8n automation flows (built on this schema)

### Uppföljningsväckaren (cron — lives in n8n, NOT Next.js)
```
every 5 min → query contacts [status = 'uppföljning' && follow_up_at <= @now]
           → flip status → 'i_ko' → the normal queue sweep dials it
```

### Anti-spam state machine (dial-time check + post-call flip)
```
Per dial decision:
  status = 'i_ko' && contact_attempts >= campaign.max_attempts (> 0) && !follow_up_at
      → flip status → 'max_försök' (terminal — never dialed again)
  status = 'i_ko' && attempts >= max && follow_up_at booked
      → leave it — the Uppföljning clock governs (the prospect bought
        another cycle by engaging)

Post-call (every call lifecycle webhook):
  create calls row (call_id, transcript, summary, duration_seconds)
  update contact:
    call_id, contact_attempts + 1, last_contacted_at
    conversation?  → last_conversation_at
    booked follow-up? → status = 'uppföljning' + follow_up_at
    no answer && attempts >= max && !follow_up_at → status = 'max_försök'
```
