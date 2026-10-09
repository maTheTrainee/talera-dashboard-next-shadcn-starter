# Säkerhetsmodell — Talera Dashboard

## Hur data flödar (varför tenants ALDRIG kan läcka till varandra)

```
Webbläsare
   │  Clerk sessions-cookie (httpOnly, secure i prod — aldrig org-ids i klientkod)
   ▼
src/proxy.ts — clerkMiddleware() på ALLA routes inkl. /api/*
   │  verifierar sessionen kryptografiskt och bifogar auth-kontexten
   ▼
src/app/dashboard/layout.tsx — auth.protect() (sidor utan session → redirect)
   ▼
src/app/api/* — requireAuthContext()
   │  401 utan inloggning · 403 utan aktiv organisation
   │  ALLA PB-filter härleds från ctx (userId, orgId) — ALDRIG från klientens payload
   ▼
PocketBase som TENANT-KONTO (src/lib/pb.ts — ensurePbOrgAuth, HMAC-derivat)
   │  PB-reglerna: clerk_org_id = @request.auth.clerk_org_id
   │  → databasen vägrar själv främmande orgs rader (en bortglömd filter = noll rader)
   │  detaljer/mutationer verifierar posten igen (record.clerk_org_id !== orgId → 404)
   ▼
Data — tenant-isolerad rad för rad (index på clerk_org_id)

Superuser endast för provisionering + n8n (cross-tenant ringare) — aldrig datafrågor.
```

### Garantierna

1. **Webbläsaren når aldrig PocketBase** — datareglerna är org-scoped eller
   superuser-only. Det finns ingen CORS-väg, ingen anon-nyckel, ingen
   klient-SDK-konfiguration.
2. **Tenancy-nyckeln kommer från sessionen** — `clerk_org_id` stämplas
   server-side av brandväggen vid POST (tillsammans med `created_by`) och
   härleds från `auth()` vid varje läsning. Klienten kan inte påverka den.
   Datafrågorna körs som orgens EGET PB-konto (HMAC-derivat) — databasen
   vägrar främmande orgs rader även vid en app-bugg.
3. **Identifiering döljs** — kors-tenant ID-probing får 404 ("hittades inte")
   istället för 403 — en angripare kan inte skilja en främmande post från en
   icke-existerande.
4. **n8n-dispatch fail-closed** — utan `N8N_WEBHOOK_URL` eller
   `N8N_WEBHOOK_SECRET` vägrar Next.js skicka kuvertet (annars skulle det gå
   ut oautentiserat). n8n-webhook-validerar `X-Talera-Secret` vid mottagning.
5. **Motorn nycklar aldrig i webbläsaren** — `start.web.session` skapar en
   temporär, engångs-, kortlivad WebRTC-URL via n8n → Ultravox.
6. **Paketgrind + cooldown** — assistentsessioner kräver ett paket med internt
   stöd (`caps.internal`) och är cooldown-spärrade (30 s/användare) eftersom
   varje klick skapar en betald enginesession.

## Granskningsregister (granskat 2026-10-09)

| Yta | Status | Notering |
|---|---|---|
| proxy.ts matcher | ✅ | Kör på alla routes inkl. `/api/*` |
| Dashboard-sidor | ✅ | `auth.protect()` i layouten |
| /api/* handlers (9 st) | ✅ | Alla anropar `requireAuthContext()` |
| PB tenant-konton + regler | ✅ | `clerk_org_id = @request.auth.clerk_org_id` — DB:n vägrar främmande rader |
| Roll-grindar (Nivå 2) | ✅ | `requireArea`/`requireOrgAdmin` — fysiska 403:er per område |
| Detalj-/mutation-nyckel | ✅ | Re-verifiering → 404 (existence maskad) |
| POST-stämplar | ✅ | `clerk_org_id` + `created_by` server-side |
| PB API-regler | ✅ | Alla null = superuser-only |
| PB nätverk (prod) | ✅ | Coolify-internt Docker-nätverk (8080) — ej publikt nåbar |
| PB nätverk (dev) | ⚠️ | Tailscale 8090 — admin-UI skyddas av superuser-lösenord; håll Tailscale-nätverket privat |
| n8n-webhook | ⚠️ | Next skickar `X-Talera-Secret` — n8n MÅSTE validera den (se n8n-launch-checklist.md) |
| Clerk-sessioner | ✅ | Clerk-standard (httpOnly, secure) |
| Rate limiting | ⚠️ | Cooldown på uv-session; skala med Upstash/Ratelimit vid behov |

## Miljövariationer

- **DEV**: PocketBase på Tailscale-port 8090 — endast superuser-regler gäller,
  admin-UI (`/_/`) skyddas av superuser-inloggningen.
- **PROD**: PocketBase på `http://pocketbase:8080` i Coolify-containernätverket
  — strukturellt onåbar utanför servern. Admin via SSH-tunnel vid behov.
- `.env.local` (PB-superuser + Clerk-nycklar) är dev-only; prod använder
  Coolify-miljövariabler.
