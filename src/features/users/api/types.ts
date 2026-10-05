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
  // Follow-up fields
  followUpAt?: string; // ISO date string for scheduled callback
  followUpDateTime?: string; // ISO date-time string for exact callback time (e.g., "2026-10-07T14:00:00Z")
  followUpStatus?: 'pending' | 'completed' | 'cancelled';
  followUpNotes?: string;
  // Campaign reference
  campaignId?: string;
  campaignName?: string;
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
  // Date/time filters
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  followUpStatus?: 'pending' | 'completed' | 'cancelled' | 'all';
  hasFollowUp?: boolean;
  // Campaign filter
  campaignId?: string;
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
