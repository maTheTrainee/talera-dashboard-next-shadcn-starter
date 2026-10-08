/**
 * UV session matrix — the single nomenclature gateway.
 *
 * This is the ONLY file in the codebase permitted to reference the upstream
 * voice streaming package identifier. Every component imports the pure-`uv`
 * alias re-exports below — never the raw package.
 *
 * The browser initializes the session using ONLY the single-use joinUrl token
 * returned by POST /api/assist/uv-session — never an API key.
 */
import {
  Role,
  UltravoxErrorEvent,
  UltravoxSession,
  UltravoxSessionStatus,
  UltravoxSessionStatusChangedEvent,
  UltravoxTranscriptsChangedEvent
} from 'ultravox-client';

export {
  UltravoxSession as UVSession,
  UltravoxSessionStatus as UVSessionStatus,
  UltravoxSessionStatusChangedEvent as UVSessionStatusChanged,
  UltravoxTranscriptsChangedEvent as UVTranscriptsChanged,
  UltravoxErrorEvent as UVError,
  Role as UVSpeakerRole
};

/** Creates a uv session bound to a single-use joinUrl. */
export function createUVSession(): UltravoxSession {
  return new UltravoxSession();
}