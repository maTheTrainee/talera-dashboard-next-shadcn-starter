import PageContainer from '@/components/layout/page-container';
import { CampaignStarter } from '@/features/campaigns/components/campaign-starter-client';

export const metadata = {
  title: 'Dashboard: Starta Kampanj'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Starta Kampanj'
      pageDescription='Skapa nya ringkampanjer eller testa enstaka samtal'
    >
      <CampaignStarter />
    </PageContainer>
  );
}
