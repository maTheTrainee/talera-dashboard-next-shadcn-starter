'use client';

import { CallHistoryView } from './call-history-view';

export default function ChatViewPage() {
  // ?callId=[ID] deep links land here — the wiring pass selects that call
  // directly from /api/calls.
  return (
    <div className='flex min-h-0 flex-1 px-4 py-2 md:px-6'>
      <CallHistoryView />
    </div>
  );
}
