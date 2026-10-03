// Ultravox Data Message Types (from https://docs.ultravox.ai/apps/datamessages)

export type UltravoxTranscriptMessage = {
  type: 'transcript';
  role: 'user' | 'agent';
  medium: 'voice' | 'text';
  text?: string; // Full transcript so far
  delta?: string; // Incremental text since last message
  final: boolean; // Whether more transcript messages expected
  ordinal: number; // Order within the call
};

export type UltravoxStateMessage = {
  type: 'state';
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
};

export type UltravoxCallStartedMessage = {
  type: 'call_started';
  callId: string;
  joinUrl: string;
  // ... other fields from Ultravox
};

export type UltravoxDebugMessage = {
  type: 'debug';
  message: string;
};

export type UltravoxPongMessage = {
  type: 'pong';
  timestamp: number;
};

export type UltravoxServerMessage =
  | UltravoxTranscriptMessage
  | UltravoxStateMessage
  | UltravoxCallStartedMessage
  | UltravoxDebugMessage
  | UltravoxPongMessage;

// Internal transcript message for UI rendering
export type TranscriptMessage = {
  id: string;
  role: 'agent' | 'prospect';
  text: string;
  timestamp: string; // MM:SS format or real-time
  isStreaming?: boolean;
};

export type CallStatus = 'completed' | 'ringing' | 'connected' | 'missed' | 'voicemail';

export type CallTranscript = {
  id: string;
  phoneNumber: string;
  customerName: string;
  campaignType: 'outbound' | 'inbound';
  status: CallStatus;
  duration?: string; // MM:SS for completed calls
  outcome?: 'booked' | 'answered' | 'missed' | 'resolved' | 'voicemail' | 'busy';
  startedAt: string;
  joinUrl?: string; // Ultravox WebSocket URL for live calls
  messages: TranscriptMessage[];
  aiSummary?: string;
  // Live call tracking
  isLive?: boolean;
  ultravoxCallId?: string;
  currentState?: 'idle' | 'listening' | 'thinking' | 'speaking';
  organizationId: string; // 🔒 SECURE: Organization isolation
};
