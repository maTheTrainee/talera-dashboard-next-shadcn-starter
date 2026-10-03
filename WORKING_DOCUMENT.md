# Voice AI SaaS Platform - Implementation Documentation

**Version:** 1.0  
**Date:** 2026-10-03  
**Branch:** `voice-ai-saas-refactor` (pushed to origin)  
**Commit:** `421def1`

---

## 1. Executive Summary

This document provides a comprehensive overview of the Voice AI SaaS platform refactoring from a generic e-commerce dashboard to a Swedish B2B Voice AI platform. The platform serves as a control center for Voice AI telephony operations, integrating with n8n orchestration pipelines and Ultravox for real-time voice AI calls.

**Repository:** https://github.com/maTheTrainee/talera-dashboard-next-shadcn-starter  
**Branch:** `voice-ai-saas-refactor` (pushed to origin)  
**Commit:** `421def1`  
**Build Status:** ✅ Passing  
**TypeScript:** ✅ Clean  
**Dev Server:** Ready in ~564ms

---

## 2. What Has Been Done

### 2.1 Core Refactoring (6 Steps)

| Step | Feature | Status | Key Files |
|------|---------|--------|-----------|
| 1 | Sidebar Navigation & Swedish/English i18n | ✅ Complete | `src/lib/i18n.tsx`, `src/config/nav-config.ts`, `src/components/layout/app-sidebar.tsx` |
| 2 | Adaptive Overview (Outbound/Inbound) | ✅ Complete | `src/features/overview/components/*`, `src/features/overview/api/*` |
| 3 | Read-Only Call Monitor Kanban | ✅ Complete | `src/features/kanban/components/*`, `src/features/kanban/utils/store.ts` |
| 4 | Voice Chat Transcripts Panel | ✅ Complete | `src/features/chat/components/*`, `src/features/chat/utils/*` |
| 5 | Hybrid Campaign Starter | ✅ Complete | `src/features/campaigns/components/campaign-starter-client.tsx`, `src/features/campaigns/api/*` |
| 6 | Leads Ledger Grids | ✅ Complete | `src/features/users/components/*`, `src/features/users/api/*` |

### 2.2 Security Implementation (Critical)

**Server-Side Authorization:**
- All API routes use Clerk `auth()` for organization isolation
- Organization-level filtering on every query via `organizationId`
- No client-side data fetching without server-side authentication
- Clerk Organizations for multi-tenant B2B isolation

**Secure API Routes Created:**
| Route | Purpose | Auth Method |
|-------|---------|-------------|
| `/api/leads` | Leads listing with pagination/filtering | Clerk `auth()` |
| `/api/leads/[id]` | Single lead CRUD | Clerk `auth()` |
| `/api/campaigns` | Campaign management | Clerk `auth()` |
| `/api/transcripts` | Call transcripts with org isolation | Clerk `auth()` |
| `/api/admin/config` | Admin configuration (role-based) | Clerk `auth()` + role check |
| `/api/n8n/connector.ts` | n8n REST connector | Internal |
| `/api/ultravox/connector.ts` | Ultravox WebSocket/REST | Internal |

### 2.3 Admin Configuration System (6 Tabs)

| Tab | Configuration | Key Fields |
|-----|---------------|------------|
| **Overview** | Campaign mode, provider status | `campaignMode`, `ultravoxConfigured`, `n8nConfigured` |
| **Schedule** | Timezone, allowed days, hours, holidays | `timezone`, `allowedDays`, `startHour`, `endHour`, `excludedDates` |
| **Ultravox** | API key, base URL, voice/model | `apiKey`, `baseUrl`, `defaultVoiceId`, `defaultModel`, `webhookSecret` |
| **n8n** | API key, webhook URL, workflow IDs | `apiKey`, `baseUrl`, `webhookUrl`, `campaignTriggerWorkflowId`, `quickDialWorkflowId`, `statusCallbackWorkflowId` |
| **Limits** | Concurrent calls, minutes, costs | `maxConcurrentCalls`, `maxDailyMinutes`, `maxMonthlyMinutes`, `outboundMinuteCost`, `inboundMinuteCost` |
| **Features** | Feature flags | `liveTranscription`, `aiSummary`, `callRecording`, `voicemailDetection`, `answeringMachineDetection` |

### 2.4 Connector Infrastructure

#### n8n Connector (`src/app/api/n8n/connector.ts`)
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

#### Ultravox Connector (`src/app/api/ultravox/connector.ts`)
```typescript
// Create outbound call (systemPrompt from n8n workflow)
const call = await createUltravoxCall(orgId, {
  systemPrompt: "<from n8n workflow>",
  voiceId: "voice_1",
  model: "ultravox-v1",
  metadata: { campaignId: "camp_123", leadId: "lead_456" }
});

// Join inbound call
const { joinUrl } = await joinUltravoxCall(orgId, callId);

// Real-time WebSocket
const ws = createUltravoxWebSocket(joinUrl);
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // msg.type: 'transcript' | 'state' | 'call_started'
};
```

---

## 3. n8n Integration - Complete Connection & Testing Guide

### 3.1 Required n8n Workflows

| Workflow ID | Trigger | Purpose | Input | Output |
|-------------|---------|---------|-------|--------|
| `campaignTriggerWorkflowId` | Webhook `POST /webhook/campaign-trigger` | Bulk campaign launch | Campaign data + lead list | Execution ID |
| `quickDialWorkflowId` | Webhook `POST /webhook/quick-dial` | Single test call | Single lead + campaign type | Join URL |
| `statusCallbackWorkflowId` | Webhook `POST /webhook/call-status` | Status updates | Call status + metadata | Status update |

### 3.2 n8n Authentication Methods

n8n supports multiple authentication methods. Configure in Admin panel:

#### Method 1: Header API Key (Recommended)
```bash
# n8n Webhook URL
https://n8n.yourdomain.com/webhook/campaign-trigger

# Headers
Authorization: Bearer <N8N_API_KEY>
X-Organization-ID: org_123
Content-Type: application/json
```

#### Method 2: JWT Token
```bash
Authorization: Bearer <JWT_TOKEN>
# JWT payload: { orgId: "org_123", role: "org_admin", exp: ... }
```

#### Method 3: Query Parameters (Less Secure)
```bash
https://n8n.yourdomain.com/webhook/campaign-trigger?api_key=<KEY>&orgId=org_123
```

#### Method 4: Custom Headers
```bash
X-API-Key: <N8N_API_KEY>
X-Auth-Token: <JWT_TOKEN>
X-Org-ID: org_123
```

### 3.3 n8n Workflow Payload Examples

#### Campaign Trigger Payload
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

#### Quick Dial Payload
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

#### Status Callback Payload
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

### 3.4 n8n Workflow Implementation Steps

#### Workflow 1: Campaign Trigger
1. **Webhook Trigger** → Receive campaign data + lead list
2. **Loop Over Leads** → For each lead:
   - Call Ultravox API: `POST https://api.ultravox.ai/api/calls`
   - Pass `systemPrompt` from n8n (stored in workflow or fetched from Ultravox)
   - Store `callId` ↔ `leadId` mapping
3. **Return** execution ID to frontend

#### Workflow 2: Quick Dial
1. **Webhook Trigger** → Receive single lead + campaign type
2. **Create Ultravox Call** → Return `joinUrl`
3. **Return** join URL to frontend for immediate testing

#### Workflow 3: Status Callback
1. **Webhook Trigger** → Receive call status updates
2. **Update Database** → Update call status in PostgreSQL
4. **Downstream Actions:**
   - `booked` → Create calendar event, send confirmation email
   - `resolved` → Close ticket, update CRM
   - `missed` → Schedule retry, notify agent

---

## 4. Ultravox Integration - Complete Connection & Testing Guide

### 4.1 Ultravox Authentication

```env
# Environment Variables
ULTRAVOX_API_KEY=uv_live_xxxxxxxxxxxxx
ULTRAVOX_BASE_URL=https://api.ultravox.ai
```

**Authentication Headers:**
```http
Authorization: Bearer <ULTRAVOX_API_KEY>
X-Organization-ID: org_123
Content-Type: application/json
```

### 4.2 Ultravox API Endpoints Used

| Operation | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| Create Call | `/api/calls` | POST | Create outbound call |
| Join Call | `/api/calls/{callId}/join` | POST | Join inbound call |
| End Call | `/api/calls/{callId}` | DELETE | End active call |
| Get Call | `/api/calls/{callId}` | GET | Get transcript/details |
| Health Check | `/api/health` | GET | Connection test |

### 4.3 Ultravox WebSocket Protocol

**Server → Client Messages:**

```json
// Transcript (streaming)
{
  "type": "transcript",
  "role": "agent",
  "medium": "voice",
  "delta": "Hej, hur kan jag hjälpa?",
  "final": false,
  "ordinal": 1
}

// State Change
{
  "type": "state",
  "state": "speaking"
}

// Call Started
{
  "type": "call_started",
  "callId": "call_abc123",
  "joinUrl": "wss://api.ultravox.ai/join/..."
}
```

**Client → Server Messages:**
```json
// Ping
{ "type": "ping", "timestamp": 1234567890.123 }

// Hang Up
{ "type": "hang_up" }

// Text Message (interrupt agent)
{ "type": "user_text_message", "text": "Avbryt", "urgency": "immediate" }

// Change Output Medium
{ "type": "set_output_medium", "medium": "voice" }
```

### 4.4 Testing Ultravox Connection

```bash
# Test API connection
curl -H "Authorization: Bearer $ULTRAVOX_API_KEY" \
     -H "X-Organization-ID: org_123" \
     https://api.ultravox.ai/api/health

# Create test call
curl -X POST https://api.ultravox.ai/api/calls \
  -H "Authorization: Bearer $ULTRAVOX_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Organization-ID: org_123" \
  -d '{
    "systemPrompt": "Test prompt",
    "voiceId": "voice_1",
    "model": "ultravox-v1"
  }'
```

---

## 5. Development Environment Setup

### 5.1 Prerequisites
- **Bun** ≥ 1.1 (package manager)
- **Node.js** ≥ 22
- **Git** ≥ 2.30

### 5.2 Installation
```bash
# Clone repository
git clone https://github.com/maTheTrainee/talera-dashboard-next-shadcn-starter.git
cd talera-dashboard-next-shadcn-starter

# Switch to feature branch
git checkout voice-ai-saas-refactor

# Install dependencies
bun install

# Copy environment template
cp env.example.txt .env.local
```

### 5.3 Environment Variables (`.env.local`)
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Ultravox
ULTRAVOX_API_KEY=uv_live_xxxxxxxxxxxxx
ULTRAVOX_BASE_URL=https://api.ultravox.ai

# n8n
N8N_BASE_URL=https://n8n.yourdomain.com
N8N_API_KEY=n8n_api_key_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
```

### 5.4 Running the Application
```bash
# Development
bun run dev          # Starts at http://localhost:3000

# Production build
bun run build

# Type checking
bun run typecheck

# Linting
bun run lint

# Production start
bun run start
```

---

## 6. Testing Procedures

### 6.1 Unit Testing (Recommended)
```bash
# Add to package.json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Test Files to Create:**
```
src/
├── features/
│   ├── admin/__tests__/admin-config.test.ts
│   ├── campaigns/__tests__/campaign-starter.test.ts
│   ├── chat/__tests__/transcript-viewer.test.ts
│   ├── kanban/__tests__/kanban-board.test.ts
│   └── users/__tests__/leads-table.test.ts
├── lib/__tests__/i18n.test.ts
├── hooks/__tests__/use-data-table.test.ts
└── app/api/__tests__/
    ├── leads.test.ts
    ├── campaigns.test.ts
    └── transcripts.test.ts
```

### 6.2 Integration Testing (Playwright)
```bash
# Add to package.json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**E2E Test Scenarios:**
```
e2e/
├── auth-flow.spec.ts           # Clerk auth + org selection
├── campaign-creation.spec.ts   # Bulk import + quick dial
├── kanban-realtime.spec.ts     # WebSocket updates
├── transcript-viewer.spec.ts   # Live transcript streaming
├── admin-config.spec.ts        # Admin panel CRUD
└── org-isolation.spec.ts       # Cross-org data isolation
```

### 6.3 API Testing (Postman/curl)

```bash
# Test leads API
curl -H "Authorization: Bearer <CLERK_TOKEN>" \
     http://localhost:3000/api/leads

# Test campaigns API
curl -H "Authorization: Bearer <CLERK_TOKEN>" \
     http://localhost:3000/api/campaigns

# Test transcripts API
curl -H "Authorization: Bearer <CLERK_TOKEN>" \
     http://localhost:3000/api/transcripts

# Test admin config (admin only)
curl -H "Authorization: Bearer <CLERK_TOKEN>" \
     http://localhost:3000/api/admin/config?admin=true
```

### 6.2 Load Testing (k6)
```javascript
// k6 script for load testing
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/leads', {
    headers: { 'Authorization': `Bearer ${__ENV.CLERK_TOKEN}` },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## 7. Future Development Recommendations

### 7.1 High Priority (Next 1-2 Sprints)

| Priority | Feature | Description | Effort |
|----------|---------|-------------|--------|
| **P0** | **Database Migration** | Replace mock services with PostgreSQL + Prisma/Drizzle | High |
| **P0** | **Clerk Webhooks** | Real-time org/user sync via Clerk webhooks | Medium |
| **P0** | **Sentry Integration** | Error tracking + performance monitoring | Low |
| **P1** | **Automated Tests** | Unit (Vitest) + E2E (Playwright) | High |
| **P1** | **Rate Limiting** | Protect API routes from abuse | Medium |

### 7.2 Medium Priority (Next Quarter)

| Priority | Feature | Description | Effort |
|----------|---------|-------------|--------|
| **P2** | **Campaign Analytics** | Conversion rates, call duration analytics | High |
| **P2** | **Agent Performance Dashboard** | Per-agent metrics, call quality scores | High |
| **P2** | **Webhook Retry Logic** | Exponential backoff for n8n/Ultravox callbacks | Medium |
| **P3** | **Multi-language Support** | Add Finnish, Norwegian, Danish | Medium |
| **P3** | **API Documentation** | OpenAPI/Swagger for all endpoints | Low |

### 7.3 Long-term (6+ Months)

| Priority | Feature | Description |
|----------|---------|-------------|
| **P4** | **Multi-region Deployment** | EU/US regions for latency optimization |
| **P4** | **Advanced AI Features** | Sentiment analysis, keyword spotting |
| **P5** | **Mobile App** | React Native companion app |
| **P5** | **White-label Solution** | Customizable branding per client |

---

## 8. Architecture Decisions Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-10-03 | Clerk Organizations for multi-tenancy | Built-in B2B support, webhooks, roles | ✅ Done |
| 2026-10-03 | TanStack Query + nuqs for data fetching | Server prefetch + client cache + URL state | ✅ Done |
| 2026-10-03 | Zustand for local UI state | Lightweight, no boilerplate | ✅ Done |
| 2026-10-03 | TanStack Form + Zod for forms | Type-safe, composable, shadcn compatible | ✅ Done |
| 2026-10-03 | Mock services → API routes pattern | Easy migration to real backend | ✅ Done |
| 2026-10-03 | Mock → API routes for all data | Security first, no client-side DB access | ✅ Done |
| 2026-10-03 | n8n for orchestration | Visual workflows, self-hosted, extensible | ✅ Done |
| 2026-10-03 | Ultravox for voice AI | Real-time streaming, Swedish support | ✅ Done |
| 2026-10-03 | shadcn/ui + Tailwind v4 | Consistent design system | ✅ Done |

---

## 9. Testing Checklist for QA

### Pre-deployment Checklist
- [ ] All unit tests pass (`bun run test`)
- [ ] All E2E tests pass (`bun run test:e2e`)
- [ ] TypeScript compiles without errors (`bun run typecheck`)
- [ ] Linting passes (`bun run lint`)
- [ ] Production build succeeds (`bun run build`)
- [ ] Dev server starts without errors (`bun run dev`)
- [ ] Clerk auth works (sign in/up, org switching)
- [ ] n8n webhooks respond correctly
- [ ] Ultravox WebSocket connects and streams
- [ ] Admin config persists and loads correctly
- [ ] Campaign creation (bulk + quick dial) works
- [ ] Leads table filters/sorts/paginates
- [ ] Transcript viewer shows live updates
- [ ] Kanban board reflects real-time state
- [ ] Org isolation verified (no cross-org data leakage)

### Production Deployment Checklist
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Clerk production keys configured
- [ ] Ultravox production API key set
- [ ] n8n production URL and API key set
- [ ] Database connected (PostgreSQL + Prisma/Drizzle)
- [ ] Clerk webhook handlers deployed
- [ ] Sentry DSN configured
- [ ] Rate limiting enabled on API routes
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Monitoring/alerting set up

---

## 10. Contact & Support

**Repository:** https://github.com/maTheTrainee/talera-dashboard-next-shadcn-starter  
**Branch:** `voice-ai-saas-refactor`  
**PR:** https://github.com/maTheTrainee/talera-dashboard-next-shadcn-starter/pull/new/voice-ai-saas-refactor

**Key Files for Onboarding:**
- `REFACORING_DOCUMENTATION.md` - This document
- `src/lib/i18n.tsx` - Translation system
- `src/lib/searchparams.ts` - URL state management
- `src/features/admin/api/types.ts` - Admin config types
- `src/app/api/n8n/connector.ts` - n8n integration
- `src/app/api/ultravox/connector.ts` - Ultravox integration

---

## Appendix: Quick Reference Commands

```bash
# Development
bun run dev              # Start dev server
bun run build            # Production build
bun run typecheck        # TypeScript check
bun run lint             # Lint code

# Testing
bun run test             # Unit tests (when added)
bun run test:e2e         # E2E tests (when added)

# Git
git checkout voice-ai-saas-refactor
git pull origin voice-ai-saas-refactor
git push -u origin voice-ai-saas-refactor

# n8n Testing
curl -X POST https://n8n.yourdomain.com/webhook/campaign-trigger \
  -H "Authorization: Bearer <N8N_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"type":"campaign_trigger","organizationId":"org_123","campaign":{"name":"Test","type":"outbound","phoneNumbers":[{"name":"Test","phone":"+46701234567"}]}}'

# Ultravox Testing
curl -X POST https://api.ultravox.ai/api/calls \
  -H "Authorization: Bearer $ULTRAVOX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt":"Test","voiceId":"voice_1","model":"ultravox-v1"}'
```

---

*Document generated as part of the Voice AI SaaS Platform refactoring project. Keep this document updated with each significant change.*