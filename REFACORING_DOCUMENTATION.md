# Voice AI SaaS Platform - Refactoring Documentation

## Overview
This document explains the complete refactoring of the Next.js 16 shadcn dashboard into a Swedish Voice AI SaaS platform for B2B clients. The platform is now a secure, multi-tenant Voice AI control center that connects to n8n orchestration pipelines and Ultravox for real-time voice AI calls.

---

## 1. Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router) with Turbopack
- **Language**: TypeScript 5.7 (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York style)
- **Auth**: Clerk (Organizations for multi-tenant B2B)
- **Data Fetching**: TanStack Query v5 + nuqs (URL state)
- **Forms**: TanStack Form + Zod validation
- **State**: Zustand (local UI state)
- **Charts**: Recharts
- **Real-time**: Ultravox WebSocket + n8n REST/webhooks
- **Package Manager**: Bun

### Project Structure (Key Directories)
```
src/
├── app/
│   ├── api/
│   │   ├── admin/config/         # Admin configuration (secure)
│   │   ├── campaigns/            # Campaign CRUD (secure)
│   │   ├── leads/                # Leads/Prospects CRUD (secure)
│   │   ├── transcripts/          # Call transcripts (secure)
│   │   ├── n8n/connector.ts      # n8n REST connector
│   │   └── ultravox/connector.ts # Ultravox WebSocket/REST connector
│   ├── dashboard/
│   │   ├── overview/             # Adaptive dashboard (Outbound/Inbound)
│   │   ├── product/              # Campaign starter (CSV + Quick Dial)
│   │   ├── kanban/               # Read-only call monitor
│   │   ├── chat/                 # Transcript viewer (AI/Prospect bubbles)
│   │   └── users/                # Leads ledger grid
│   └── layout.tsx                # Root layout with providers
├── features/
│   ├── admin/                    # Admin configuration system
│   ├── campaigns/                # Campaign management
│   ├── chat/                     # Transcript viewer + Ultravox WS
│   ├── kanban/                   # Read-only call monitor
│   ├── overview/                 # Adaptive dashboard components
│   └── users/                    # Leads ledger
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Sidebar, Header, PageContainer
│   └── forms/                    # TanStack Form field components
├── lib/
│   ├── i18n.tsx                  # Swedish/English i18n system
│   ├── form.ts                   # TanStack Form hook
│   ├── query-client.ts           # TanStack Query client
│   └── searchparams.ts           # nuqs search params
├── hooks/                        # Custom React hooks
└── config/                       # Navigation, info config
```

---

## 2. Security Model (Critical)

### Server-Side Authorization
**ALL data access goes through secure API routes using Clerk `auth()`:**

```typescript
// Every API route starts with:
const { orgId } = await auth();
if (!orgId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Organization Isolation
- Every query includes `organizationId` from Clerk `auth()`
- No client-side data fetching without server-side auth
- Clerk Organizations provide multi-tenant B2B isolation
- Role-based access: `org_admin`, `platform_admin` (stored in Clerk publicMetadata)

### Data Flow
```
Client → API Route (Clerk auth) → Service Layer → Mock/DB → Response
```
**NO direct client-to-database access.** All data flows through secure API routes.

---

## 3. Core Features Implemented

### 3.1 Navigation & i18n (`src/lib/i18n.tsx`)
- Full Swedish/English translation system
- Context-based locale switching (localStorage persisted)
- All UI text uses `t('key')` function
- Navigation keys in `src/config/nav-config.ts` use i18n keys

### 3.2 Adaptive Overview (`src/features/overview/`)
- **Campaign Type Toggle**: Outbound (Appointment Setting) / Inbound (Support AI)
- **Dynamic Stats Cards**:
  - Outbound: Saldo, Ringda, Svarade, Bokade 🚀
  - Inbound: Aktiva linjer, Mottagna, Svarade, Lösta ✅
- **Charts**: Area, Bar, Pie - all Swedish labels, campaign-aware data
- **Recent Events Table**: Phone, Duration, Outcome (Bokad/Missad/Röstbrevlåda)

### 3.3 Read-Only Call Monitor Kanban (`src/features/kanban/`)
- **Columns**: I Kö → Ringer... → Aktivt Samtal 🎙️ → Slutförda
- **Drag Disabled**: `onValueChange={() => {}}` - backend controls state
- **Real-time**: Ultravox WebSocket updates card positions

### 3.4 Transcript Viewer (`src/features/chat/`)
- **Left Panel**: Conversation list (phone, name, duration, status badge)
- **Right Panel**: Message bubbles (Left=AI Agent grey, Right=Prospect dark)
- **Live Streaming**: Ultravox WebSocket for real-time transcripts
- **Auto-connect**: WebSocket connects when viewing live calls

### 3.5 Campaign Starter (`src/features/campaigns/`)
- **Bulk Import**: CSV drag-drop, template download, preview table
- **Quick Dial**: Single number test call with name, phone, campaign type
- **n8n Integration**: Both paths send to n8n webhook with orgId

### 3.6 Leads Ledger (`src/features/users/`)
- **Table**: Telefonnummer, Kundnamn, Status, Längd (sek), AI Sammanfattning
- **Filters**: Status, Campaign Type, Search
- **Server-side**: TanStack Query + nuqs via secure `/api/leads`

---

## 4. Admin Configuration System (`src/features/admin/`)

### Tabs
1. **Overview**: Campaign mode, Ultravox/n8n status badges
2. **Schedule**: Timezone, allowed days, hours, excluded dates
3. **Ultravox**: API key, base URL, voice/model, webhook secret
4. **n8n**: API key, base URL, webhook URL, workflow IDs
5. **Limits**: Concurrent calls, daily/monthly minutes, SEK/min costs
5. **Features**: Live transcription, AI summary, recording, voicemail/AMD detection

### Security
- Only accessible by org admins (check `publicMetadata.role === 'org_admin'`)
- Platform admins can view all org configs (`admin=true` query param)

---

## 5. Connector Infrastructure

### 5.1 n8n Connector (`src/app/api/n8n/connector.ts`)

```typescript
// Trigger campaign
await triggerN8NCampaign(orgId, campaignData);

// Trigger quick dial
await triggerN8NQuickDial(orgId, dialData);

// Send call status updates
await sendCallStatusToN8N(orgId, callId, 'ringing' | 'connected' | 'completed');

// Test connection
await testN8NConnection(orgId);
```

**Authentication**: n8n supports multiple auth methods:
- **Header API Key**: `Authorization: Bearer <API_KEY>`
- **Header JWT**: `Authorization: Bearer <JWT_TOKEN>`
- **Query Param**: `?api_key=<KEY>` or `?token=<JWT>`
- **Custom Headers**: `X-API-Key`, `X-Auth-Token`, etc.

**Configuration in Admin** (per organization):
```json
{
  "n8n": {
    "enabled": true,
    "baseUrl": "https://n8n.yourdomain.com",
    "apiKey": "n8n_api_key_here",
    "webhookUrl": "https://n8n.yourdomain.com/webhook/",
    "campaignTriggerWorkflowId": "workflow_campaign_trigger",
    "quickDialWorkflowId": "workflow_quick_dial",
    "statusCallbackWorkflowId": "workflow_status_callback"
  }
}
```

### n8n Webhook Payload Examples

**Campaign Trigger** (`POST /webhook/campaign-trigger`):
```json
{
  "type": "campaign_trigger",
  "organizationId": "org_123",
  "campaign": {
    "name": "Q4 Avtalssättning",
    "type": "outbound",
    "phoneNumbers": [
      { "name": "Erik Andersson", "phone": "+46 70 123 45 67" },
      { "name": "Anna Johansson", "phone": "+46 73 987 65 43" }
    ]
  },
  "timestamp": "2026-10-03T14:30:00Z"
}
```

**Quick Dial** (`POST /webhook/quick-dial`):
```json
{
  "type": "quick_dial",
  "organizationId": "org_123",
  "dial": {
    "name": "Test Kund",
    "phone": "+46 70 111 22 33",
    "campaignType": "outbound"
  },
  "timestamp": "2026-10-03T14:30:00Z"
}
```

**Status Callback** (`POST /webhook/call-status`):
```json
{
  "type": "call_status",
  "organizationId": "org_123",
  "callId": "call_abc123",
  "status": "connected",
  "metadata": {
    "duration": 120,
    "outcome": "booked"
  },
  "timestamp": "2026-10-03T14:35:00Z"
}
```

---

### 5.2 Ultravox Connector (`src/app/api/ultravox/connector.ts`)

```typescript
// Create outbound call (systemPrompt from n8n workflow)
const call = await createUltravoxCall(orgId, {
  systemPrompt: "<provided by n8n workflow>",
  voiceId: "voice_1",
  model: "ultravox-v1",
  metadata: { campaignId: "camp_123", leadId: "lead_456" }
});

// Returns: { callId, joinUrl, createdAt }

// Join inbound call
const { joinUrl } = await joinUltravoxCall(orgId, callId);

// End call
await endUltravoxCall(orgId, callId);

// Get transcript
const call = await getUltravoxCall(orgId, callId);

// Real-time WebSocket
const ws = createUltravoxWebSocket(joinUrl);
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // msg.type: 'transcript' | 'state' | 'call_started'
};
```

**Ultravox WebSocket Messages**:

**Server → Client** (Incoming):
```json
// Transcript (streaming)
{
  "type": "transcript",
  "role": "agent",           // "agent" | "user"
  "medium": "voice",
  "delta": "Hej, hur kan jag hjälpa?",
  "final": false,
  "ordinal": 1
}

// State change
{
  "type": "state",
  "state": "speaking"       // "idle" | "listening" | "thinking" | "speaking"
}

// Call started
{
  "type": "call_started",
  "callId": "call_abc123",
  "joinUrl": "wss://api.ultravox.ai/join/..."
}
```

**Client → Server** (Outgoing):
```json
// Ping
{ "type": "ping", "timestamp": 1234567890.123 }

// Hang up
{ "type": "hang_up" }

// Text message (interrupt agent)
{ "type": "user_text_message", "text": "Avbryt", "urgency": "immediate" }

// Change output medium
{ "type": "set_output_medium", "medium": "voice" }
```

### Ultravox Authentication
- **API Key**: `Authorization: Bearer <ULTRAVOX_API_KEY>` (admin config)
- **Organization Header**: `X-Organization-ID: <orgId>`
- **WebSocket**: Auth via joinUrl token (included in joinUrl from `createUltravoxCall`)

### Ultravox Configuration in Admin
```json
{
  "ultravox": {
    "enabled": true,
    "apiKey": "uv_live_xxxxxxxxxxxxx",
    "baseUrl": "https://api.ultravox.ai",
    "defaultVoiceId": "voice_1",
    "defaultModel": "ultravox-v1",
    "webhookSecret": "secret_for_n8n_callbacks"
  }
}
```

---

## 6. n8n Workflow Integration Guide

### 6.1 Required n8n Workflows

#### Workflow 1: Campaign Trigger (`campaignTriggerWorkflowId`)
**Trigger**: Webhook `POST /webhook/campaign-trigger`
**Input**: Campaign data + lead list
**Steps**:
1. Receive campaign + lead list
2. For each lead: Create Ultravox call via `createUltravoxCall`
3. Store callId + leadId mapping in n8n/SQL
4. Return executionId to frontend

#### Workflow 2: Quick Dial (`quickDialWorkflowId`)
**Trigger**: Webhook `POST /webhook/quick-dial`
**Input**: Single lead + campaign type
**Steps**:
1. Create Ultravox call
2. Return joinUrl for immediate testing

#### Workflow 3: Status Callback (`statusCallbackWorkflowId`)
**Trigger**: Webhook `POST /webhook/call-status` (from n8n/Ultravox)
**Input**: Call status updates
**Steps**:
1. Update call status in database
2. Trigger downstream: CRM update, notifications, analytics
3. Handle outcomes: booked → create calendar event, resolved → close ticket

### 6.2 Ultravox Agent Configuration (Managed in Ultravox Dashboard)
**Prompts are NOT in frontend** - they live in Ultravox via n8n:
- n8n workflow fetches prompt from Ultravox or stores in n8n
- n8n passes `systemPrompt` to `createUltravoxCall`
- Ultravox Dashboard: Manage agents, voices, models, tools

### 6.3 Authentication Flow for n8n

#### Option A: API Key Header (Recommended)
```bash
# n8n Webhook URL: https://n8n.yourdomain.com/webhook/campaign-trigger
# Headers:
Authorization: Bearer <N8N_API_KEY>
X-Organization-ID: org_123
Content-Type: application/json
```

#### Option B: JWT Token
```bash
# If n8n uses JWT auth
Authorization: Bearer <JWT_TOKEN>
# JWT payload: { orgId: "org_123", role: "org_admin", exp: ... }
```

#### Option C: Query Parameter (Less Secure)
```bash
# Webhook with query param
https://n8n.yourdomain.com/webhook/campaign-trigger?api_key=<KEY>&orgId=org_123
```

#### Option D: Custom Headers
```bash
X-API-Key: <N8N_API_KEY>
X-Auth-Token: <JWT_TOKEN>
X-Org-ID: org_123
```

### 6.4 Environment Variables (`.env.local`)
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Ultravox
ULTRAVOX_API_KEY=uv_live_xxxxxxxxxxxxx

# n8n
N8N_BASE_URL=https://n8n.yourdomain.com
N8N_API_KEY=n8n_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. Development Setup

### Install & Run
```bash
# Install dependencies
bun install

# Development
bun run dev

# Build
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

### Clerk Setup
1. Create Clerk application at https://dashboard.clerk.com
2. Enable Organizations (B2B)
3. Enable Billing (optional)
4. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`
5. Configure organization roles: `org_admin`, `member`

### Ultravox Setup
1. Create account at https://ultravox.ai
2. Create API key in Ultravox Dashboard
3. Configure agents, voices, models in Ultravox Dashboard
4. Add `ULTRAVOX_API_KEY` to `.env.local`

### n8n Setup
1. Deploy n8n (self-hosted or cloud)
2. Create API key in n8n Settings → API Keys
3. Create workflows as described in Section 6
4. Add webhook URLs to n8n config in Admin panel

---

## 8. Key Files Reference

### Security & Auth
- `src/app/api/leads/route.ts` - Secure leads API
- `src/app/api/campaigns/route.ts` - Secure campaigns API
- `src/app/api/transcripts/route.ts` - Secure transcripts API
- `src/app/api/admin/config/route.ts` - Admin config API
- `src/features/admin/api/service.ts` - Admin service with `isCallAllowedNow()`

### Connectors
- `src/app/api/n8n/connector.ts` - n8n REST client
- `src/app/api/ultravox/connector.ts` - Ultravox REST + WebSocket client

### Frontend Features
- `src/features/admin/components/admin-dashboard.tsx` - Admin panel
- `src/features/campaigns/components/campaign-starter-client.tsx` - Campaign starter
- `src/features/chat/components/transcript-view.tsx` - Live transcript viewer
- `src/features/kanban/components/kanban-board.tsx` - Read-only Kanban
- `src/features/overview/components/overview-client.tsx` - Adaptive overview

### Configuration
- `src/lib/i18n.tsx` - i18n system
- `src/config/nav-config.ts` - Navigation (uses i18n keys)
- `src/lib/searchparams.ts` - nuqs search params with orgId
- `src/features/admin/api/types.ts` - Admin config types

---

## 9. Deployment Notes

### Production Checklist
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Configure Clerk production keys
- [ ] Set Ultravox production API key
- [ ] Configure n8n production URL and API key
- [ ] Set up Clerk webhook for org/user sync (if needed)
- [ ] Configure Sentry DSN (optional)
- [ ] Set up database (replace mock services with Prisma/Drizzle/Supabase)
- [ ] Enable Clerk Organization webhooks for real-time sync

### Docker (Optional)
```dockerfile
FROM oven/bun:1.1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

---

## 10. Troubleshooting

### Common Issues
1. **Clerk auth fails**: Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
2. **n8n webhook 401**: Verify n8n API key and headers
3. **Ultravox WebSocket fails**: Check `ULTRAVOX_API_KEY` and joinUrl validity
4. **Build fails**: Run `bun run typecheck` to see TypeScript errors
5. **Font errors**: Ensure `Google_Sans_Flex` removed from `font.config.ts`

### Debug Endpoints
- `GET /api/admin/config?admin=true` - List all org configs (platform admin)
- `GET /api/leads` - Test leads API
- `GET /api/campaigns` - Test campaigns API
- `POST /api/n8n/connector/test` - Test n8n connection
- `POST /api/ultravox/connector/test` - Test Ultravox connection

---

## 11. Future Extensions

- [ ] Replace mock services with Prisma/Drizzle + PostgreSQL
- [ ] Add Clerk webhook handlers for real-time org/user sync
- [ ] Implement Sentry error tracking
- [ ] Add automated tests (Vitest + Playwright)
- [ ] Implement n8n workflow templates as code
- [ ] Add OpenAPI/Swagger docs for API routes
- [ ] Implement rate limiting on API routes
- [ ] Add audit logging for admin actions

---

*Document Version: 1.0 | Last Updated: 2026-10-03 | Platform: Voice AI SaaS for Swedish B2B Market*