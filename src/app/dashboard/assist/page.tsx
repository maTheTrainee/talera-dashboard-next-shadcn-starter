import PageContainer from '@/components/layout/page-container';
import { AssistWorkspace } from '@/features/assist/components/assist-workspace';

export const metadata = {
  title: 'Dashboard: Ring AI-Assistent'
};

export default function AssistPage() {
  return (
    <PageContainer
      pageTitle='Ring AI-Assistent'
      pageDescription='Din AI-assistent är redo — tryck för att ringa. Samtalet startar direkt i webbläsaren via en säker röstanslutning.'
    >
      <AssistWorkspace />
    </PageContainer>
  );
}