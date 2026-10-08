import PageContainer from '@/components/layout/page-container';
import { AssistWorkspace } from '@/features/assist/components/assist-workspace';

export const metadata = {
  title: 'Dashboard: Ring AI-Assistent'
};

export default function AssistPage() {
  return (
    <PageContainer
      pageTitle='Ring AI-Assistent'
      pageDescription='Säker, textlös WebRTC-ljudarbetsyta.'
    >
      <AssistWorkspace />
    </PageContainer>
  );
}