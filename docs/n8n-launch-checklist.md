# n8n Launch-checklista — kontakter som måste byggas

Allt nedan byggs i n8n (NOT Next.js). Next.js skickar endast kuvert till den
master-webhook som beskrivs i flöde 1 och läser resultat från PocketBase.
Fullständig schema: docs/pocketbase-schema.md · Säkerhetsmodell:
docs/security.md.

## Autentiseringsuppgifter som måste sättas i n8n

| Credential | Används till |
|---|---|
| `N8N_WEBHOOK_SECRET` | MÅSTE matcha Next.js-env med samma namn — valideras som `X-Talera-Secret`-headern i flöde 1 (annars 401) |
| PocketBase superuser (e-post + lösenord eller token) | `n8n-nodes-pocketbase-admin`-noden — alla läs/skriv mot PocketBase |
| `ULTRAVOX_API_KEY` | Skapa samtal/sessioner via Ultravox API (Authorization: Bearer) |
| Telefonimjukning (nummerleverantör) | Inkommande 08-nummer → webhook → UV phone-session |

## Flöde 1 — Master-webhook: `POST /webhook/dashboard-api`

```
Webhook-nod (POST) → IF-node: header X-Talera-Secret === $env.N8N_WEBHOOK_SECRET
                    → annars: svara 401 och stanna
→ Switch-node på body.action:

  start.web.session (payload: { user_id })
      → HTTP Request → Ultravox: POST /api/calls
        (Authorization: Bearer $env.ULTRAVOX_API_KEY)
      → svara { joinUrl: <temporär WebRTC-URL> } till Next.js

  start.batch.campaign (payload: { campaign_id, campaign })
      → registrera/aktivera kampanjen för ringaren (eller no-op om
        ringaren pollar PocketBase direkt — se flöde 3)
```

## Flöde 2 — Ultravox call lifecycle webhooks (per samtal)

```
Webhook-nod (Ultravox event) → hämta kampanjen via callens campaign-relation
   → PocketBase create calls:
       clerk_org_id  ← ÄRV från kampanj-radens clerk_org_id (aldrig från eventet)
       campaign (relation) · prospect (relation)
       call_id (uv-engine-id, REQUIRED) · call_type (utgående/inkommande/intern)
       status · outcome · summary (n8n-genererad sammanfattning)
       duration_seconds · transcript (json)
   → PocketBase update contact:
       call_id · call_summary · call_outcome
       contact_attempts + 1 · last_contacted_at
       konversation? → last_conversation_at
       bokat uppföljning? → status = 'uppföljning' + follow_up_at
       inget svar && försök >= max && !follow_up_at → status = 'max_försök'
```

## Flöde 3 — Ringare: kö-svep (cron var 2–5 min)

```
Schedule Trigger → PocketBase query:
    campaigns [status = 'live' && schemafönster pågår (08–19)]
  → contacts [status = 'i_ko' && campaign = kampanjen]
  → Anti-spam (dial-time check):
      contact_attempts >= campaign.max_attempts (> 0) && !follow_up_at
          → flip status → 'max_försök' (terminal — rings aldrig igen)
      follow_up_at bokat → hoppa över (Uppföljningsväckaren styr)
  → Ultravox: POST /api/calls (utgående — outbound_number eller n8ns
    fallback-nummer när kampanjen valt "Använd förvalt nummer")
  → flip status → 'ringer'
```

## Flöde 4 — Uppföljningsväckaren (cron var 5 min)

```
Schedule Trigger → PocketBase query:
    contacts [status = 'uppföljning' && follow_up_at <= @now]
  → flip status → 'i_ko' → den normala kö-svepen ringer den
```

## Flöde 5 — Minutbokföring (per avslutat samtal)

```
Trigger: call lifecycle (ended) → PocketBase upsert usage_daily:
    clerk_org_id (från samtalet) · date (YYYY-MM-DD)
    minutes_used += duration_seconds / 60
    overage_minutes = max(0, minutes_used − paketets dagliga gräns)
  (unikt index på (clerk_org_id, date) gör upserten idempotent)
```

## Flöde 6 — Inkommande receptionist (08-nummer)

```
Telefonileverantörens webhook (inkommande samtal på org:ens 08-nummer)
  → slå upp numbers-rad (number = det ringda numret)
  → clerk_org_id ← ÄRV från numbers-radens clerk_org_id
  → Ultravox phone-session (receptionist-agenten svarar)
  → calls-rader: call_type = 'inkommande' (samma post-call-uppdatering
    som flöde 2)
```

## Efter launch (valfria)

- **Positiva händelser-feed** — Översiktens händelsekort + prospekt-popup läser
  kontakter med nyliga positiva utfall (från flöde 2:s statusflippar).
- **Agent-sync** — `agents`-samlingen synkas från motorn (n8n cron).
- **Notifikationer** — notiskön pushas vid max_försök / bokat möte.

## End-to-end-testlista (innan launch)

1. Skapa kampanj i dashboarden → POST → raden får clerk_org_id + created_by ✓
2. Ladda upp CSV i kampanjguiden → kontakter med campaign-relation ✓
3. Sätt kampanjen live (PATCH) → start.batch.campaign → flöde 1 validerar secret ✓
4. Svepen ringer i_ko-kontakter → status ringer → i samtal → avslutat ✓
5. Post-call: calls-rad + kontakt uppdaterad (call_summary, försök) ✓
6. Uppföljning bokad → väckaren flippar till i_ko vid tiden ✓
7. Max försök utan uppföljning → max_försök (rings aldrig igen) ✓
8. usage_daily upsertas per dag, minuter dras från poolen ✓
9. Inkommande samtal på 08-numret → inkommande-rad, org ärvd ✓
10. Annan organisations användare kan INTE se/komma åt datan (404) ✓
