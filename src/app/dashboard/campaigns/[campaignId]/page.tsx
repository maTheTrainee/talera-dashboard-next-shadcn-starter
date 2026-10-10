import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import {
  CampaignCockpit,
  CampaignCockpitSkeleton
} from '@/features/campaigns/components/campaign-cockpit';

export const metadata = {
  title: 'Dashboard: Kampanjdetaljer'
};

type PageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function CampaignDetailPage({ params }: PageProps) {
  const { campaignId } = await params;

  return (
    <PageContainer
      pageTitle='Kampanjdetaljer'
      pageDescription='Status, prospekter och samtalstranskript för kampanjen.'
    >
      <Suspense fallback={<CampaignCockpitSkeleton />}>
        <CampaignCockpit campaignId={campaignId} />
      </Suspense>
    </PageContainer>
  );
}
