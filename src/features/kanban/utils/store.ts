import { create } from 'zustand';

export type CallStatus = 'pending' | 'ringing' | 'connected' | 'completed';

export type CallRecord = {
  id: string;
  phoneNumber: string;
  customerName: string;
  status: CallStatus;
  campaignType: 'outbound' | 'inbound';
  duration?: string; // MM:SS format
  outcome?: 'booked' | 'answered' | 'missed' | 'resolved' | 'voicemail' | 'busy';
  startedAt: string;
  updatedAt: string;
};

const COLUMN_IDS: CallStatus[] = ['pending', 'ringing', 'connected', 'completed'];

const initialColumns: Record<CallStatus, CallRecord[]> = {
  pending: [
    {
      id: '1',
      phoneNumber: '+46 70 123 45 67',
      customerName: 'Erik Andersson',
      status: 'pending',
      campaignType: 'outbound',
      startedAt: '2026-10-03T10:00:00Z',
      updatedAt: '2026-10-03T10:00:00Z'
    },
    {
      id: '2',
      phoneNumber: '+46 73 987 65 43',
      customerName: 'Anna Johansson',
      status: 'pending',
      campaignType: 'outbound',
      startedAt: '2026-10-03T10:05:00Z',
      updatedAt: '2026-10-03T10:05:00Z'
    },
    {
      id: '3',
      phoneNumber: '+46 76 555 12 34',
      customerName: 'Lars Nilsson',
      status: 'pending',
      campaignType: 'outbound',
      startedAt: '2026-10-03T10:10:00Z',
      updatedAt: '2026-10-03T10:10:00Z'
    }
  ],
  ringing: [
    {
      id: '4',
      phoneNumber: '+46 70 222 33 44',
      customerName: 'Maria Svensson',
      status: 'ringing',
      campaignType: 'outbound',
      startedAt: '2026-10-03T10:15:00Z',
      updatedAt: '2026-10-03T10:15:00Z'
    },
    {
      id: '5',
      phoneNumber: '+46 72 444 55 66',
      customerName: 'Johan Karlsson',
      status: 'ringing',
      campaignType: 'outbound',
      startedAt: '2026-10-03T10:16:00Z',
      updatedAt: '2026-10-03T10:16:00Z'
    }
  ],
  connected: [
    {
      id: '6',
      phoneNumber: '+46 73 777 88 99',
      customerName: 'Sofia Lindberg',
      status: 'connected',
      campaignType: 'outbound',
      duration: '03:45',
      startedAt: '2026-10-03T09:50:00Z',
      updatedAt: '2026-10-03T09:53:45Z'
    },
    {
      id: '7',
      phoneNumber: '+46 8 123 45 67',
      customerName: 'Kundtjänst AB',
      status: 'connected',
      campaignType: 'inbound',
      duration: '05:22',
      startedAt: '2026-10-03T09:30:00Z',
      updatedAt: '2026-10-03T09:35:22Z'
    }
  ],
  completed: [
    {
      id: '8',
      phoneNumber: '+46 31 987 65 43',
      customerName: 'Support Center',
      status: 'completed',
      campaignType: 'inbound',
      duration: '06:45',
      outcome: 'resolved',
      startedAt: '2026-10-03T09:00:00Z',
      updatedAt: '2026-10-03T09:06:45Z'
    },
    {
      id: '9',
      phoneNumber: '+46 40 555 12 34',
      customerName: 'Helpdesk Sverige',
      status: 'completed',
      campaignType: 'inbound',
      duration: '03:22',
      outcome: 'resolved',
      startedAt: '2026-10-03T08:45:00Z',
      updatedAt: '2026-10-03T08:48:22Z'
    },
    {
      id: '10',
      phoneNumber: '+46 8 222 33 44',
      customerName: 'Service Partner',
      status: 'completed',
      campaignType: 'inbound',
      duration: '02:10',
      outcome: 'resolved',
      startedAt: '2026-10-03T08:30:00Z',
      updatedAt: '2026-10-03T08:32:10Z'
    }
  ]
};

type CallStoreState = {
  columns: Record<CallStatus, CallRecord[]>;
  setColumns: (columns: Record<CallStatus, CallRecord[]>) => void;
  updateCallStatus: (callId: string, newStatus: CallStatus) => void;
  addCall: (call: Omit<CallRecord, 'id'>) => void;
};

export const useCallStore = create<CallStoreState>()((set) => ({
  columns: initialColumns,

  setColumns: (columns) => set({ columns }),

  updateCallStatus: (callId, newStatus) =>
    set((state) => {
      // Find and remove call from current column
      let callToMove: CallRecord | undefined;
      const newColumns: Record<CallStatus, CallRecord[]> = {
        pending: [...state.columns.pending],
        ringing: [...state.columns.ringing],
        connected: [...state.columns.connected],
        completed: [...state.columns.completed]
      };

      for (const status of COLUMN_IDS) {
        const index = newColumns[status].findIndex((c) => c.id === callId);
        if (index !== -1) {
          callToMove = newColumns[status].splice(index, 1)[0];
          break;
        }
      }

      if (callToMove) {
        const updatedCall = {
          ...callToMove,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        newColumns[newStatus] = [updatedCall, ...newColumns[newStatus]];
      }

      return { columns: newColumns };
    }),

  addCall: (call) =>
    set((state) => {
      const newCall: CallRecord = {
        ...call,
        id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return {
        columns: {
          ...state.columns,
          pending: [newCall, ...state.columns.pending]
        }
      };
    })
}));
