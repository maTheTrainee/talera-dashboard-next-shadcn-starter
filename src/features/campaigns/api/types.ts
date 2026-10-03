export type CampaignType = 'outbound' | 'inbound';

export type Campaign = {
  id: string;
  name: string;
  type: CampaignType;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
  totalNumbers: number;
  calledNumbers: number;
  answeredCalls: number;
  bookedMeetings: number;
  organizationId: string;
};

export type CampaignFilters = {
  page?: number;
  limit?: number;
  type?: CampaignType;
  status?: Campaign['status'];
  search?: string;
  sort?: string;
  organizationId?: string; // 🔒 SECURE: Organization filter
};

export type CampaignsResponse = {
  success: boolean;
  time: string;
  message: string;
  total_campaigns: number;
  offset: number;
  limit: number;
  campaigns: Campaign[];
};

export type CampaignByIdResponse = {
  success: boolean;
  time: string;
  message: string;
  campaign: Campaign;
};

export type CampaignMutationPayload = {
  name: string;
  type: CampaignType;
  phoneNumbers: Array<{ name: string; phone: string }>;
  organizationId: string;
};

export type CSVRow = {
  name: string;
  phone: string;
};

export type QuickDialPayload = {
  name: string;
  phone: string;
  campaignType: CampaignType;
  organizationId: string;
};
