import ChatViewPage from '@/features/chat/components/chat-view-page';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Samtalshistorik'
};

export default function Page() {
  // Suspense-gräns runt ?callId-djuplänken (useSearchParams kräver en vid
  // statisk rendering).
  return (
    <Suspense>
      <ChatViewPage />
    </Suspense>
  );
}
