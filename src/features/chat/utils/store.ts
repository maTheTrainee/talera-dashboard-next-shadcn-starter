import { create } from 'zustand';
import type { CallTranscript, TranscriptMessage, UltravoxServerMessage } from './types';

interface TranscriptState {
  transcripts: CallTranscript[];
  selectedTranscriptId: string;
  activeWs: WebSocket | null;
  activeCallId: string | null;

  selectTranscript: (id: string) => void;
  getActiveTranscript: () => CallTranscript | undefined;
  connectLiveCall: (callId: string, joinUrl: string) => void;
  disconnectLiveCall: (callId: string) => void;
  addStreamingMessage: (callId: string, message: TranscriptMessage) => void;
  updateStreamingMessage: (
    callId: string,
    messageId: string,
    text: string,
    isFinal: boolean
  ) => void;
  updateCallState: (callId: string, state: 'idle' | 'listening' | 'thinking' | 'speaking') => void;
  finalizeLiveCall: (callId: string, outcome: CallTranscript['outcome'], duration: string) => void;
}

export const useTranscriptStore = create<TranscriptState>()((set, get) => ({
  transcripts: [],
  selectedTranscriptId: '',
  activeWs: null,
  activeCallId: null,

  selectTranscript: (id) => {
    const state = get();

    // Disconnect from previous live call if any
    if (state.activeWs && state.activeCallId && state.activeCallId !== id) {
      state.activeWs.close();
    }

    set((state) => ({
      selectedTranscriptId: id,
      activeWs: null,
      activeCallId: null
    }));
  },

  getActiveTranscript: () => {
    const state = get();
    return state.transcripts.find((c) => c.id === state.selectedTranscriptId);
  },

  connectLiveCall: (callId: string, joinUrl: string) => {
    const state = get();

    // Close existing connection if any
    if (state.activeWs) {
      state.activeWs.close();
    }

    const ws = new WebSocket(joinUrl);

    ws.onopen = () => {
      console.log(`Ultravox WebSocket connected for call ${callId}`);
    };

    ws.onmessage = (event) => {
      try {
        const message: UltravoxServerMessage = JSON.parse(event.data);
        handleUltravoxMessage(callId, message);
      } catch (err) {
        console.error('Failed to parse Ultravox message:', err);
      }
    };

    ws.onclose = () => {
      console.log(`Ultravox WebSocket closed for call ${callId}`);
      // Check if call should be finalized
      const transcript = get().transcripts.find((t) => t.id === callId);
      if (transcript?.isLive && transcript.status === 'connected') {
        // Call ended without explicit finalization - mark as completed
        get().finalizeLiveCall(callId, 'answered', '00:00');
      }
    };

    ws.onerror = (error) => {
      console.error(`Ultravox WebSocket error for call ${callId}:`, error);
    };

    set({ activeWs: ws, activeCallId: callId });
  },

  disconnectLiveCall: (callId: string) => {
    const state = get();
    if (state.activeWs && state.activeCallId === callId) {
      state.activeWs.close();
      set({ activeWs: null, activeCallId: null });
    }
  },

  addStreamingMessage: (callId: string, message: TranscriptMessage) => {
    set((state) => ({
      transcripts: state.transcripts.map((t) => {
        if (t.id === callId) {
          return {
            ...t,
            messages: [...t.messages, message],
            isLive: true
          } as CallTranscript;
        }
        return t;
      })
    }));
  },

  updateStreamingMessage: (callId: string, messageId: string, text: string, isFinal: boolean) => {
    set((state) => ({
      transcripts: state.transcripts.map((t) => {
        if (t.id === callId) {
          return {
            ...t,
            messages: t.messages.map((m) => {
              if (m.id === messageId) {
                return { ...m, text, isStreaming: !isFinal };
              }
              return m;
            })
          } as CallTranscript;
        }
        return t;
      })
    }));
  },

  updateCallState: (callId: string, stateValue: 'idle' | 'listening' | 'thinking' | 'speaking') => {
    set((state) => ({
      transcripts: state.transcripts.map((t) => {
        if (t.id === callId) {
          return { ...t, currentState: stateValue } as CallTranscript;
        }
        return t;
      })
    }));
  },

  finalizeLiveCall: (callId: string, outcome: CallTranscript['outcome'], duration: string) => {
    set((state) => ({
      transcripts: state.transcripts.map((t) => {
        if (t.id === callId) {
          return {
            ...t,
            status: 'completed',
            outcome,
            duration,
            isLive: false,
            activeWs: undefined
          } as CallTranscript;
        }
        return t;
      }),
      activeWs: null,
      activeCallId: null
    }));
  }
}));

function handleUltravoxMessage(callId: string, message: UltravoxServerMessage) {
  const state = useTranscriptStore.getState();
  const transcript = state.transcripts.find((t) => t.id === callId);

  if (!transcript) return;

  switch (message.type) {
    case 'transcript': {
      const isAgent = message.role === 'agent';
      const messageId = `live-${message.ordinal}-${message.role}`;
      const existingMessage = transcript.messages.find((m) => m.id === messageId);

      if (message.delta) {
        // Streaming delta - append to existing message
        if (existingMessage) {
          const newText = existingMessage.text + message.delta;
          state.updateStreamingMessage(callId, messageId, newText, message.final);
        } else {
          // New streaming message
          state.addStreamingMessage(callId, {
            id: messageId,
            role: isAgent ? 'agent' : 'prospect',
            text: message.delta,
            timestamp: getCurrentTimestamp(),
            isStreaming: !message.final
          });
        }
      } else if (message.text) {
        // Full text update
        if (existingMessage) {
          state.updateStreamingMessage(callId, messageId, message.text, message.final);
        } else {
          state.addStreamingMessage(callId, {
            id: messageId,
            role: isAgent ? 'agent' : 'prospect',
            text: message.text,
            timestamp: getCurrentTimestamp(),
            isStreaming: !message.final
          });
        }
      }
      break;
    }
    case 'state': {
      state.updateCallState(callId, message.state);
      // If state becomes idle, the call has ended
      if (message.state === 'idle') {
        // The call ended naturally
        const transcript = state.transcripts.find((t) => t.id === callId);
        if (transcript?.isLive) {
          // We'll wait for onclose to finalize
        }
      }
      break;
    }
    case 'call_started': {
      console.log('Call started:', message.callId);
      break;
    }
  }
}

function getCurrentTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Initialize with data after store creation
setTimeout(() => {
  const { initialTranscripts } = require('./data');
  useTranscriptStore.setState({
    transcripts: initialTranscripts,
    selectedTranscriptId: initialTranscripts[0]?.id ?? ''
  });
}, 0);
