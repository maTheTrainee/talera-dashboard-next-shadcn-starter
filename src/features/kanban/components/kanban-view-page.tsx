import PageContainer from '@/components/layout/page-container';
import { RealtimeBoard } from './realtime-board';

export default function KanbanViewPage() {
  return (
    <PageContainer
      pageTitle='Realtidsvy'
      pageDescription='Live-översikt över pågående röstsamtal — korten flyttas automatiskt av systemet.'
    >
      <RealtimeBoard />
    </PageContainer>
  );
}
