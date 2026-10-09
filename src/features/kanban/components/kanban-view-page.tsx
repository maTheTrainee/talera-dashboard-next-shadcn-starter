import PageContainer from '@/components/layout/page-container';
import { RealtimeBoard } from './realtime-board';

export default function KanbanViewPage() {
  return (
    <PageContainer
      pageTitle='Realtidsvy'
      pageDescription='Pågående röstsamtal i realtid.'
    >
      <RealtimeBoard />
    </PageContainer>
  );
}
