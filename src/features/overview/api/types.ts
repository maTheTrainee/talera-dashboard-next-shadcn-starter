export type CampaignType = 'outbound' | 'inbound';

export type OverviewStats = {
  remainingBalance: number;
  calledNumbers: number;
  answeredCalls: number;
  bookedMeetings: number;
  activeLines: number;
  receivedCalls: number;
  resolvedIssues: number;
};

export type CallEvent = {
  id: string;
  phoneNumber: string;
  customerName: string;
  duration: string; // MM:SS format
  outcome: 'booked' | 'answered' | 'missed' | 'resolved' | 'voicemail' | 'busy';
  timestamp: string;
  campaignType: CampaignType;
};

export type OverviewFilters = {
  campaignType?: CampaignType;
  timeRange?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  search?: string;
};

export type OverviewResponse = {
  success: boolean;
  time: string;
  message: string;
  stats: OverviewStats;
  events: CallEvent[];
};
