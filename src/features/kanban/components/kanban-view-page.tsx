import PageContainer from '@/components/layout/page-container';
import { KanbanBoard } from './kanban-board';

export default function KanbanViewPage() {
  return (
    <PageContainer pageTitle='Realtidsvy' pageDescription='Övervaka samtalsflöde i realtid'>
      <KanbanBoard />
    </PageContainer>
  );
}
