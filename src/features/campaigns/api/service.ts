import { delay } from '@/constants/mock-api';
import type {
  Campaign,
  CampaignFilters,
  CampaignsResponse,
  CampaignMutationPayload,
  QuickDialPayload,
  CSVRow
} from './types';

// n8n webhook URL from environment variables
const N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://yourdomain.se/webhook/campaign';

const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Q4 Avtalssättning - Säkerhetsbolag',
    type: 'outbound',
    status: 'active',
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-10-03T08:00:00Z',
    totalNumbers: 500,
    calledNumbers: 342,
    answeredCalls: 245,
    bookedMeetings: 42,
    organizationId: 'org-1',
    scheduleStartTime: '08:00',
    scheduleEndTime: '16:00',
    scheduleDate: '2026-10-03',
    startedAt: '2026-10-03T08:15:00Z'
  },
  {
    id: 'camp-2',
    name: 'Support AI - Inkommande',
    type: 'inbound',
    status: 'active',
    createdAt: '2026-09-20T14:00:00Z',
    updatedAt: '2026-10-03T09:00:00Z',
    totalNumbers: 0,
    calledNumbers: 0,
    answeredCalls: 0,
    bookedMeetings: 0,
    organizationId: 'org-1'
  },
  {
    id: 'camp-3',
    name: 'Black Friday Kampanj',
    type: 'outbound',
    status: 'completed',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-25T16:00:00Z',
    totalNumbers: 1000,
    calledNumbers: 1000,
    answeredCalls: 723,
    bookedMeetings: 156,
    organizationId: 'org-1',
    scheduleStartTime: '09:00',
    scheduleEndTime: '17:00',
    scheduleDate: '2026-10-25',
    startedAt: '2026-10-25T09:05:00Z',
    completedAt: '2026-10-25T16:00:00Z'
  }
];

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const nameIndex = headers.indexOf('name');
  const phoneIndex = headers.indexOf('phone');

  if (nameIndex === -1 || phoneIndex === -1) {
    throw new Error('CSV måste innehålla "name" och "phone" kolumner');
  }

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(',').map((v) => v.trim());
      return {
        name: values[nameIndex] || '',
        phone: values[phoneIndex] || ''
      };
    })
    .filter((row) => row.name && row.phone);
}

function generateCSVTemplate(): string {
  return 'name,phone\nErik Andersson,+46 70 123 45 67\nAnna Johansson,+46 73 987 65 43\nLars Nilsson,+46 76 555 12 34\n';
}

// Type guard for Date objects
function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

// Build the n8n payload with Clerk multi-tenancy anchors
function buildN8nPayload(
  data: CampaignMutationPayload & { organizationName?: string; scheduleDate?: string | Date }
): object {
  const phoneNumbersArray = data.phoneNumbers.map((p) => p.phone);

  // Handle scheduleDate - could be string or Date
  let startDateStr: string | undefined;
  if (data.scheduleDate) {
    if (isDate(data.scheduleDate)) {
      startDateStr = data.scheduleDate.toISOString().split('T')[0];
    } else {
      startDateStr = data.scheduleDate;
    }
  }

  return {
    clerkOrgId: data.organizationId,
    organizationName: data.organizationName || '',
    campaignName: data.name,
    campaignType: data.type,
    scheduling: data.scheduleDate
      ? {
          startDate: startDateStr,
          startTime: data.scheduleStartTime || '08:00',
          endTime: data.scheduleEndTime || '12:00'
        }
      : undefined,
    phoneNumbers: phoneNumbersArray,
    customerName: null // For bulk CSV, we don't have a single customer name
  };
}

function buildQuickDialPayload(data: QuickDialPayload & { organizationName?: string }): object {
  return {
    clerkOrgId: data.organizationId,
    organizationName: data.organizationName || '',
    campaignName: `Quick Dial - ${data.name}`,
    campaignType: data.campaignType,
    scheduling: undefined,
    phoneNumbers: [data.phone],
    customerName: data.name
  };
}

export async function getCampaigns(filters: CampaignFilters): Promise<CampaignsResponse> {
  await delay(500);

  let campaigns = [...mockCampaigns];

  if (filters.type) {
    campaigns = campaigns.filter((c) => c.type === filters.type);
  }
  if (filters.status) {
    campaigns = campaigns.filter((c) => c.status === filters.status);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    campaigns = campaigns.filter((c) => c.name.toLowerCase().includes(search));
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;
  const paginatedCampaigns = campaigns.slice(offset, offset + limit);

  return {
    success: true,
    time: new Date().toISOString(),
    message: 'Kampanjer hämtade',
    total_campaigns: campaigns.length,
    offset,
    limit,
    campaigns: paginatedCampaigns
  };
}

export async function getCampaignById(id: string) {
  await delay(300);
  const campaign = mockCampaigns.find((c) => c.id === id);

  if (!campaign) {
    return {
      success: false,
      message: `Kampanj med ID ${id} hittades inte`
    };
  }

  return {
    success: true,
    time: new Date().toISOString(),
    message: `Kampanj med ID ${id} hittades`,
    campaign
  };
}

export async function createCampaign(
  data: CampaignMutationPayload & { organizationName?: string; scheduleDate?: string | Date }
): Promise<{ success: boolean; message: string; campaign?: Campaign; n8nResponse?: unknown }> {
  // Build the n8n payload with Clerk organization anchor
  const n8nPayload = buildN8nPayload(data);

  try {
    // Send to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const n8nResult = await response.json();

    // Create local campaign record for immediate UI feedback
    let scheduleDateStr: string | undefined;
    if (data.scheduleDate) {
      if (isDate(data.scheduleDate)) {
        scheduleDateStr = data.scheduleDate.toISOString().split('T')[0];
      } else {
        scheduleDateStr = data.scheduleDate;
      }
    }

    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: data.name,
      type: data.type,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalNumbers: data.phoneNumbers.length,
      calledNumbers: 0,
      answeredCalls: 0,
      bookedMeetings: 0,
      organizationId: data.organizationId,
      scheduleStartTime: data.scheduleStartTime,
      scheduleEndTime: data.scheduleEndTime,
      scheduleDate: scheduleDateStr,
      startedAt: new Date().toISOString()
    };

    mockCampaigns.unshift(newCampaign);

    return {
      success: true,
      message: 'Kampanj skapad och skickad till n8n!',
      campaign: newCampaign,
      n8nResponse: n8nResult
    };
  } catch (error) {
    console.error('Failed to send campaign to n8n:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Fel vid skickande till n8n'
    };
  }
}

export async function quickDial(
  data: QuickDialPayload & { organizationName?: string }
): Promise<{ success: boolean; message: string; n8nResponse?: unknown }> {
  // Build the n8n payload with Clerk organization anchor
  const n8nPayload = buildQuickDialPayload(data);

  try {
    // Send to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const n8nResult = await response.json();

    return {
      success: true,
      message: 'Testsamtal initierat och skickat till n8n!',
      n8nResponse: n8nResult
    };
  } catch (error) {
    console.error('Failed to send quick dial to n8n:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Fel vid skickande till n8n'
    };
  }
}

export { parseCSV, generateCSVTemplate };
