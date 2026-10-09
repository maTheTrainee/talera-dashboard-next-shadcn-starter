# Roller & paket — tillgångsmodellen (tre nivåer)

## Synlighet = rollens områden ∩ organisationens paket

```
Vad en person ser =  rollens områden (deras tak)  ∩  organisationens paket (orgens tak)
```

- **Ingen roll — inte ens admin — kan visa mer än orgen äger.** Paketen är
  taket för ALLA roller (en kund som köpt enbart Utgående ser aldrig AI
  Assistenten, inte ens deras admin).
- **Roller bor i Clerk, aldrig i databasen** — en persons roll är en egenskap
  hos deras medlemskap i en specifik org (admin i en org, medlem i en annan).
- **Paket bor i PocketBase** (users.subscription_tier) — skrivs ENDAST av
  Talera (superuser). Kunden kan aldrig ge sig själva ett paket.

## Nivåerna

```
NIVÅ 1 — CLERK (identitet)      Vem är du? Vilken org? Vilken roll?
NIVÅ 2 — APP-GRINDEN (firewall) Får DENNA person använda funktionen? → 403
NIVÅ 3 — PB TENANT-KONTO (DB)   Får begäran röra ANNAN orgs rader? → DB vägrar
```

## Rollbuntarna (Clerk-custom-roller — provisionerade via scripts/clerk-roles.ts)

| Clerk-nyckel | Namn i Team-hanteringen | Ger områden |
|---|---|---|
| `org:admin` (inbyggd) | **Admin** | alla (orgens paket sätter taket) |
| `org:op_utgaende` | **Utgående samtal** — ringkampanjer & prospekt | utgaende |
| `org:op_inkommande` | **Inkommande samtal** — statistik & historik | inkommande |
| `org:op_ai_assistent` | **AI Assistent** | ai_assistent |
| `org:op_utgaende_inkommande` | **Utgående + Inkommande samtal** | båda |
| `org:op_utgaende_ai` | **Utgående samtal + AI Assistent** | |
| `org:op_inkommande_ai` | **Inkommande samtal + AI Assistent** | |
| `org:op_alla` | **Alla funktioner** | alla tre |
| `org:member` (inbyggd) | Medlem (onboarding) | inget |

Rollerna bär inga Clerk-permissions: operatörer kan inte bjuda in/hantera
orgen i Clerk — det är admin (org:admin) som ger ut rollerna i
Team-hanteringen (inbjudan → välj roll).

## Sidomenyn per roll (nav + ⌘K = samma filtrerade lista)

| Sidomeny | Krav | Admin | Utg. | Ink. | AI | Alla |
|---|---|---|---|---|---|---|
| Översikt | något operativt område | ✅ | ✅ | ✅ | ❌ | ✅ |
| Ringkampanjer | utgaende | ✅ | ✅ | ❌ | ❌ | ✅ |
| Kontakter | utgaende eller inkommande | ✅ | ✅ | ✅ | ❌ | ✅ |
| Realtidsvy | utgaende eller inkommande | ✅ | ✅ | ✅ | ❌ | ✅ |
| Samtalshistorik | utgaende eller inkommande | ✅ | ✅ | ✅ | ❌ | ✅ |
| Ring AI-Assistent | ai_assistent | ✅* | ❌ | ❌ | ✅ | ✅* |

*alltid ∩ paket — köpte de inte AI Assistenten syns den inte ens för admin.

## API-grindarna (fysiska 403:er — Nivå 2, src/lib/api-auth.ts)

| Route | Grind |
|---|---|
| `/api/campaigns*` | area **utgaende** |
| `/api/contacts*` | area **utgaende eller inkommande** |
| `/api/calls/*` | area **utgaende eller inkommande** |
| `/api/usage` + `/api/numbers` | **org:admin** |
| `/api/assist/uv-session` | area **ai_assistent** + paket `caps.internal` |
| `/dashboard/assist` (sidan) | paket + roll → "Ingår inte i ert paket"-skärm |
| `/dashboard/overview` (layout) | roll med operativt område (ej AI-only) |

## Nivå 3 — PB tenant-konton (databasen låser själv)

- Ett PB-konto per org = deras `users`-rad. Lösenordet är derivat:
  `HMAC-SHA256(PB_ORG_PASSWORD_SECRET, clerk_org_id)` — stateless, aldrig
  lagrat. Reglerna på alla samlingar: `clerk_org_id =
  @request.auth.clerk_org_id` — en bortglömd filter i en route handler
  returnerar noll främmande rader eftersom PocketBase själv vägrar.
- Superuser behålls endast för: pb-setup, n8n (ringaren är cross-tenant) och
  tenant-radens provisionering. Appens blast radius: från *alla kunder* till
  *en org*.

## Auto-flödet (noll manuellt jobb)

```
Signup → ingen org? → redirect till Workspaces → org skapas + aktiveras automatiskt
→ Första autentiserade begäran provisioningar tenant-raden (DELTID standard)
→ Talera öppnar PB-admin → markerar köpta paket → syns för orgen vid nästa session
→ Org-admin ger medlemmar svenska roller i Team-hanteringen
```

## Byråmodellen — kunden vill att Talera sköter kontot

Kunden bjuder in Taleras operatörskonto till SIN organisation som
`org:admin` (Team-hanteringen → inbjudan). Allt följer automatiskt:

1. Operatören får kundens org i org-växlaren — kan vara medlem i MÅNGA
   kundorgar och växla mellan dem
2. Allt styrs av kundens paket (max kampanjer, minuter, funktioner)
3. Full spårbarhet: varje rad som operatören skapar stämplas `created_by`
   (operatörens Clerk-user-id) — kunden ser vem som gjorde vad
4. Återkallande = kunden tar bort medlemskapet → omedelbar åtkomstförlust,
   inga uppgifter kvar i databasen
5. Operatören behöver aldrig kundens PB-lösenord — de agerar via sitt
   medlemskap, exakt som en anställd
