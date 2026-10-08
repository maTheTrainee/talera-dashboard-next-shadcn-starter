# PocketBase Schema — Talera Collections

Provision these collections in the PocketBase admin UI (or via the migration
workflow). The Next.js server singleton (`src/lib/pb.ts`) and the n8n
`n8n-nodes-pocketbase-admin` node both operate on these shapes.

## `users` (built-in auth collection — extended)
| Field | Type | Notes |
|---|---|---|
| `clerk_org_id` | text | Links the dashboard user to the Clerk organization |
| `subscription_tier` | select | `DELTID` / `HELTID` / `TEAM` / `ENTERPRISE` |
| `pb_container_id` | text | Optional — per-tenant container override for n8n routing |

## `campaigns`
| Field | Type | Notes |
|---|---|---|
| `org_id` | text | Tenant isolation key — every query filters on this |
| `name` | text | |
| `description` | text | |
| `status` | select | `köad` / `live` / `pausad` / `avslutat` |
| `scheduled_start` | text (ISO) | ≥ 4h window enforced by Zod |
| `scheduled_end` | text (ISO) | |
| `uv_agent_id` | text | Voice agent identifier |
| `outbound_number` | text | E.164 (07X ➔ +467X cleaned on input) |

## `contacts` (Kontaktlistor / prospects)
| Field | Type | Notes |
|---|---|---|
| `org_id` | text | Tenant isolation key |
| `campaign` | relation → campaigns | Optional — locks the prospect into a campaign |
| `call_id` | text | Engine call id written back by n8n after each call |
| `first_name` / `last_name` / `email` / `phone` | text | Phone stored E.164 |
| `status` | select | `ny` / `i_ko` / `ringer` / `i_samtal` / `avslutat` / `ej_svar` |
| `call_outcome` | text | Written by n8n post-call |

## `calls` (Samtalshistorik / transcripts)
| Field | Type | Notes |
|---|---|---|
| `org_id` | text | Tenant isolation key |
| `campaign` | relation → campaigns | |
| `prospect` | relation → contacts | |
| `call_id` | text | Engine session id (uv) |
| `status` | select | Live cycle state |
| `outcome` / `summary` | text | n8n-generated post-call summary |
| `duration_seconds` | number | Feeds daily minute accounting |
| `transcript` | json | `[{ text, speaker: 'user' \| 'agent', isFinal }]` |

## `usage_daily`
| Field | Type | Notes |
|---|---|---|
| `org_id` | text | Tenant isolation key |
| `date` | text | `YYYY-MM-DD` |
| `minutes_used` | number | Aggregate call minutes for the day |
| `overage_minutes` | number | Minutes beyond the tier daily limit (n8n-tracked) |

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
