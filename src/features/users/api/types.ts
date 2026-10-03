export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'booked' | 'closed' | 'lost';

export type Lead = {
  id: string;
  phoneNumber: string;
  customerName: string;
  status: LeadStatus;
  duration: number; // seconds
  aiSummary: string;
  campaignType: 'outbound' | 'inbound';
  createdAt: string;
  updatedAt: string;
  organizationId: string;
};

export type CreateLeadData = Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>;

export type LeadFilters = {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  campaignType?: 'outbound' | 'inbound';
  search?: string;
  sort?: string;
  organizationId?: string; // 🔒 SECURE: Organization filter
};

export type LeadsResponse = {
  success: boolean;
  time: string;
  message: string;
  total_leads: number;
  offset: number;
  limit: number;
  leads: Lead[];
};
