// ============================================================
// Lead Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
// Queries (queries.ts) and components import from here — they never change.
//
// Pick your pattern and replace the function bodies below:
//
// 1. Server Actions + ORM (Prisma / Drizzle / Supabase)
//    → Add 'use server' at the top of this file
//    → Call your ORM directly in each function
//
// 2. Route Handlers + ORM
//    → import { apiClient } from '@/lib/api-client'
//    → return apiClient<LeadsResponse>('/leads?...')
//    → Replace mock calls in route handlers (src/app/api/leads/) with ORM
//
// 3. BFF — Route Handlers proxy to external backend (Laravel, Go, etc.)
//    → import { apiClient } from '@/lib/api-client'
//    → return apiClient<LeadsResponse>('/leads?...')
//    → Route handlers proxy requests to your external backend service
//
// 4. Direct external API (frontend-only, no Next.js backend)
//    → const res = await fetch('https://your-api.com/leads?...')
//    → return res.json()
//
// Current: Mock (in-memory fake data for demo/prototyping)
// ============================================================

import { delay } from '@/constants/mock-api';
import type { Lead, LeadFilters, LeadsResponse, CreateLeadData } from './types';

const mockLeads: Lead[] = [
  {
    id: '1',
    phoneNumber: '+46 70 123 45 67',
    customerName: 'Erik Andersson',
    status: 'booked',
    duration: 272,
    aiSummary:
      'Kunden var intresserad av vår premiumlösning. Bokat möte för torsdag 10:00 för demo.',
    campaignType: 'outbound',
    createdAt: '2026-10-03T10:15:00Z',
    updatedAt: '2026-10-03T10:19:32Z',
    organizationId: 'org-1',
    campaignId: 'camp-1',
    campaignName: 'Q4 Avtalssättning - Säkerhetsbolag',
    followUpAt: '2026-10-10T10:00:00Z',
    followUpStatus: 'pending',
    followUpNotes: 'Bokat möte - skicka bekräftelse'
  },
  {
    id: '2',
    phoneNumber: '+46 73 987 65 43',
    customerName: 'Anna Johansson',
    status: 'contacted',
    duration: 138,
    aiSummary: 'Kunden svarade men var upptagen. Be om att ringa tillbaka nästa vecka.',
    campaignType: 'outbound',
    createdAt: '2026-10-03T09:45:00Z',
    updatedAt: '2026-10-03T09:47:18Z',
    organizationId: 'org-1',
    campaignId: 'camp-1',
    campaignName: 'Q4 Avtalssättning - Säkerhetsbolag',
    followUpAt: '2026-10-07T14:00:00Z',
    followUpStatus: 'pending',
    followUpNotes: 'Ring tillbaka nästa vecka'
  },
  {
    id: '3',
    phoneNumber: '+46 76 555 12 34',
    customerName: 'Lars Nilsson',
    status: 'new',
    duration: 45,
    aiSummary: 'Ingen svar, röstbrevlåda. AI lämnade meddelande med callback-nummer.',
    campaignType: 'outbound',
    createdAt: '2026-10-03T09:30:00Z',
    updatedAt: '2026-10-03T09:30:45Z',
    organizationId: 'org-1',
    campaignId: 'camp-3',
    campaignName: 'Black Friday Kampanj'
  },
  {
    id: '4',
    phoneNumber: '+46 8 123 45 67',
    customerName: 'Kundtjänst AB',
    status: 'closed',
    duration: 405,
    aiSummary:
      'Kund hade frågor om fakturering. AI löste genom att skicka kopia av faktura via mail och förklarade betalningsvillkor.',
    campaignType: 'inbound',
    createdAt: '2026-10-03T11:20:00Z',
    updatedAt: '2026-10-03T11:26:45Z',
    organizationId: 'org-1',
    campaignId: 'camp-2',
    campaignName: 'Support AI - Inkommande'
  },
  {
    id: '5',
    phoneNumber: '+46 31 987 65 43',
    customerName: 'Support Center',
    status: 'closed',
    duration: 202,
    aiSummary:
      'Teknisk fråga om API-integration. AI vägledde genom autentiseringsflöde och skickade dokumentationslänk.',
    campaignType: 'inbound',
    createdAt: '2026-10-03T10:55:00Z',
    updatedAt: '2026-10-03T10:58:22Z',
    organizationId: 'org-1',
    campaignId: 'camp-2',
    campaignName: 'Support AI - Inkommande'
  },
  {
    id: '6',
    phoneNumber: '+46 40 555 12 34',
    customerName: 'Helpdesk Sverige',
    status: 'closed',
    duration: 190,
    aiSummary: 'Fråga om prissättning. AI skickade prislista och bokade demo.',
    campaignType: 'inbound',
    createdAt: '2026-10-03T10:30:00Z',
    updatedAt: '2026-10-03T10:33:10Z',
    organizationId: 'org-1',
    campaignId: 'camp-2',
    campaignName: 'Support AI - Inkommande'
  },
  {
    id: '7',
    phoneNumber: '+46 8 222 33 44',
    customerName: 'Service Partner',
    status: 'qualified',
    duration: 130,
    aiSummary: 'Intresserad av enterprise-lösning. AI kvalificerade och bokade uppföljning.',
    campaignType: 'inbound',
    createdAt: '2026-10-03T10:05:00Z',
    updatedAt: '2026-10-03T10:07:10Z',
    organizationId: 'org-1',
    campaignId: 'camp-2',
    campaignName: 'Support AI - Inkommande',
    followUpAt: '2026-10-08T11:00:00Z',
    followUpStatus: 'pending',
    followUpNotes: 'Uppföljning enterprise-lösning'
  },
  {
    id: '8',
    phoneNumber: '+46 31 444 55 66',
    customerName: 'Tech Support',
    status: 'contacted',
    duration: 115,
    aiSummary: 'Fråga om integrationsmöjligheter. AI svarade och skickade teknisk dokumentation.',
    campaignType: 'inbound',
    createdAt: '2026-10-03T09:40:00Z',
    updatedAt: '2026-10-03T09:41:55Z',
    organizationId: 'org-1',
    campaignId: 'camp-2',
    campaignName: 'Support AI - Inkommande'
  },
  {
    id: '9',
    phoneNumber: '+46 70 222 33 44',
    customerName: 'Maria Svensson',
    status: 'booked',
    duration: 236,
    aiSummary: 'Bokat möte för fredag 14:00. Vill se demo av AI-agent för support.',
    campaignType: 'outbound',
    createdAt: '2026-10-03T09:15:00Z',
    updatedAt: '2026-10-03T09:18:56Z',
    organizationId: 'org-1',
    campaignId: 'camp-1',
    campaignName: 'Q4 Avtalssättning - Säkerhetsbolag',
    followUpAt: '2026-10-11T14:00:00Z',
    followUpStatus: 'pending',
    followUpNotes: 'Demo AI-agent för support'
  },
  {
    id: '10',
    phoneNumber: '+46 72 444 55 66',
    customerName: 'Johan Karlsson',
    status: 'lost',
    duration: 83,
    aiSummary: 'Ej intresserad just nu. Be om att kontakta om 6 månader.',
    campaignType: 'outbound',
    createdAt: '2026-10-03T08:50:00Z',
    updatedAt: '2026-10-03T08:51:23Z',
    organizationId: 'org-1',
    campaignId: 'camp-3',
    campaignName: 'Black Friday Kampanj'
  }
];

export async function getLeads(filters: LeadFilters): Promise<LeadsResponse> {
  await delay(300);

  let leads = [...mockLeads];

  if (filters.status) {
    leads = leads.filter((l) => l.status === filters.status);
  }
  if (filters.campaignType) {
    leads = leads.filter((l) => l.campaignType === filters.campaignType);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    leads = leads.filter(
      (l) => l.customerName.toLowerCase().includes(search) || l.phoneNumber.includes(search)
    );
  }
  // Date range filtering
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom).getTime();
    leads = leads.filter((l) => new Date(l.createdAt).getTime() >= fromDate);
  }
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo).getTime();
    leads = leads.filter((l) => new Date(l.createdAt).getTime() <= toDate);
  }
  // Follow-up status filtering
  if (filters.followUpStatus && filters.followUpStatus !== 'all') {
    leads = leads.filter((l) => l.followUpStatus === filters.followUpStatus);
  }
  if (filters.hasFollowUp) {
    leads = leads.filter((l) => !!l.followUpAt);
  }

  if (filters.sort) {
    try {
      const sortItems = JSON.parse(filters.sort) as { id: string; desc: boolean }[];
      if (sortItems.length > 0) {
        const { id, desc } = sortItems[0];
        leads.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[id];
          const bVal = (b as Record<string, unknown>)[id];
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return desc ? bVal - aVal : aVal - bVal;
          }
          const aStr = String(aVal ?? '').toLowerCase();
          const bStr = String(bVal ?? '').toLowerCase();
          return desc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
        });
      }
    } catch {
      // Invalid sort param — ignore
    }
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;
  const paginatedLeads = leads.slice(offset, offset + limit);

  return {
    success: true,
    time: new Date().toISOString(),
    message: 'Prospekt hämtade',
    total_leads: leads.length,
    offset,
    limit,
    leads: paginatedLeads
  };
}

export async function createLead(data: CreateLeadData): Promise<Lead> {
  await delay(300);

  const newLead: Lead = {
    ...data,
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockLeads.push(newLead);

  return newLead;
}
