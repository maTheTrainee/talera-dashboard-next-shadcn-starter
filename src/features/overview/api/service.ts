import { delay } from '@/constants/mock-api';
import type {
  OverviewFilters,
  OverviewResponse,
  OverviewStats,
  CallEvent,
  CampaignType
} from './types';

const mockOutboundStats: OverviewStats = {
  remainingBalance: 12450,
  calledNumbers: 1247,
  answeredCalls: 892,
  bookedMeetings: 156,
  activeLines: 0,
  receivedCalls: 0,
  resolvedIssues: 0
};

const mockInboundStats: OverviewStats = {
  remainingBalance: 0,
  calledNumbers: 0,
  answeredCalls: 0,
  bookedMeetings: 0,
  activeLines: 8,
  receivedCalls: 2341,
  resolvedIssues: 1987
};

const mockOutboundEvents: CallEvent[] = [
  {
    id: '1',
    phoneNumber: '+46 70 123 45 67',
    customerName: 'Erik Andersson',
    duration: '04:32',
    outcome: 'booked',
    timestamp: '2026-10-03T10:15:00Z',
    campaignType: 'outbound'
  },
  {
    id: '2',
    phoneNumber: '+46 73 987 65 43',
    customerName: 'Anna Johansson',
    duration: '02:18',
    outcome: 'answered',
    timestamp: '2026-10-03T09:45:00Z',
    campaignType: 'outbound'
  },
  {
    id: '3',
    phoneNumber: '+46 76 555 12 34',
    customerName: 'Lars Nilsson',
    duration: '00:45',
    outcome: 'voicemail',
    timestamp: '2026-10-03T09:30:00Z',
    campaignType: 'outbound'
  },
  {
    id: '4',
    phoneNumber: '+46 70 222 33 44',
    customerName: 'Maria Svensson',
    duration: '03:56',
    outcome: 'booked',
    timestamp: '2026-10-03T09:15:00Z',
    campaignType: 'outbound'
  },
  {
    id: '5',
    phoneNumber: '+46 72 444 55 66',
    customerName: 'Johan Karlsson',
    duration: '01:23',
    outcome: 'missed',
    timestamp: '2026-10-03T08:50:00Z',
    campaignType: 'outbound'
  },
  {
    id: '6',
    phoneNumber: '+46 73 777 88 99',
    customerName: 'Sofia Lindberg',
    duration: '05:12',
    outcome: 'answered',
    timestamp: '2026-10-03T08:30:00Z',
    campaignType: 'outbound'
  }
];

const mockInboundEvents: CallEvent[] = [
  {
    id: '7',
    phoneNumber: '+46 8 123 45 67',
    customerName: 'Kundtjänst AB',
    duration: '06:45',
    outcome: 'resolved',
    timestamp: '2026-10-03T11:20:00Z',
    campaignType: 'inbound'
  },
  {
    id: '8',
    phoneNumber: '+46 31 987 65 43',
    customerName: 'Support Center',
    duration: '03:22',
    outcome: 'resolved',
    timestamp: '2026-10-03T10:55:00Z',
    campaignType: 'inbound'
  },
  {
    id: '9',
    phoneNumber: '+46 40 555 12 34',
    customerName: 'Helpdesk Sverige',
    duration: '02:10',
    outcome: 'resolved',
    timestamp: '2026-10-03T10:30:00Z',
    campaignType: 'inbound'
  },
  {
    id: '10',
    phoneNumber: '+46 8 222 33 44',
    customerName: 'Service Partner',
    duration: '04:18',
    outcome: 'resolved',
    timestamp: '2026-10-03T10:05:00Z',
    campaignType: 'inbound'
  },
  {
    id: '11',
    phoneNumber: '+46 31 444 55 66',
    customerName: 'Tech Support',
    duration: '01:55',
    outcome: 'answered',
    timestamp: '2026-10-03T09:40:00Z',
    campaignType: 'inbound'
  }
];

const chartDataOutbound = [
  { day: 'Mån', calls: 145, answered: 102, booked: 18 },
  { day: 'Tis', calls: 189, answered: 134, booked: 24 },
  { day: 'Ons', calls: 167, answered: 118, booked: 21 },
  { day: 'Tors', calls: 198, answered: 142, booked: 28 },
  { day: 'Fre', calls: 212, answered: 156, booked: 32 },
  { day: 'Lör', calls: 89, answered: 62, booked: 12 },
  { day: 'Sön', calls: 47, answered: 31, booked: 5 }
];

const chartDataInbound = [
  { day: 'Mån', received: 312, answered: 287, resolved: 254 },
  { day: 'Tis', received: 378, answered: 351, resolved: 312 },
  { day: 'Ons', received: 345, answered: 318, resolved: 289 },
  { day: 'Tors', received: 398, answered: 372, resolved: 334 },
  { day: 'Fre', received: 423, answered: 398, resolved: 356 },
  { day: 'Lör', received: 189, answered: 167, resolved: 145 },
  { day: 'Sön', received: 156, answered: 134, resolved: 112 }
];

const pieDataOutbound = [
  { name: 'Bokade', value: 156, color: 'var(--chart-1)' },
  { name: 'Svarade', value: 736, color: 'var(--chart-2)' },
  { name: 'Röstbrevlåda', value: 189, color: 'var(--chart-3)' },
  { name: 'Missade', value: 112, color: 'var(--chart-4)' },
  { name: 'Upptagna', value: 54, color: 'var(--chart-5)' }
];

const pieDataInbound = [
  { name: 'Lösta', value: 1987, color: 'var(--chart-1)' },
  { name: 'Svarade', value: 354, color: 'var(--chart-2)' },
  { name: 'Köade', value: 89, color: 'var(--chart-3)' },
  { name: 'Missade', value: 23, color: 'var(--chart-4)' }
];

export async function getOverviewStats(filters: OverviewFilters): Promise<OverviewResponse> {
  await delay(500);

  const campaignType = filters.campaignType ?? 'outbound';
  const stats = campaignType === 'outbound' ? mockOutboundStats : mockInboundStats;
  const events = campaignType === 'outbound' ? mockOutboundEvents : mockInboundEvents;

  return {
    success: true,
    time: new Date().toISOString(),
    message: 'Översiktsdata hämtad',
    stats,
    events
  };
}

export function getOutboundChartData() {
  return chartDataOutbound;
}

export function getInboundChartData() {
  return chartDataInbound;
}

export function getOutboundPieData() {
  return pieDataOutbound;
}

export function getInboundPieData() {
  return pieDataInbound;
}

export function getMockStats(campaignType: CampaignType): OverviewStats {
  return campaignType === 'outbound' ? mockOutboundStats : mockInboundStats;
}

export function getMockEvents(campaignType: CampaignType): CallEvent[] {
  return campaignType === 'outbound' ? mockOutboundEvents : mockInboundEvents;
}
