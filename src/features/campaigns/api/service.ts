import { delay } from '@/constants/mock-api';
import type {
  Campaign,
  CampaignFilters,
  CampaignsResponse,
  CampaignMutationPayload,
  QuickDialPayload,
  CSVRow
} from './types';

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
  data: CampaignMutationPayload
): Promise<{ success: boolean; message: string; campaign?: Campaign }> {
  await delay(1000);

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
    organizationId: data.organizationId
  };

  mockCampaigns.unshift(newCampaign);

  return {
    success: true,
    message: 'Kampanj skapad och skickad till n8n!',
    campaign: newCampaign
  };
}

export async function quickDial(
  data: QuickDialPayload
): Promise<{ success: boolean; message: string }> {
  await delay(500);

  console.log('Quick dial sent to n8n:', data);

  return {
    success: true,
    message: 'Testsamtal initierat!'
  };
}

export { parseCSV, generateCSVTemplate };
