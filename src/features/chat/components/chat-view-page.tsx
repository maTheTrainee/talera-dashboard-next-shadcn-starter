'use client';

import PageContainer from '@/components/layout/page-container';
import { TranscriptPanel } from './messenger';

export default function ChatViewPage() {
  return (
    <PageContainer
      pageTitle='Samtals-Transkriptioner'
      pageDescription='Granska och analysera samtalshistorik'
    >
      <TranscriptPanel />
    </PageContainer>
  );
}
