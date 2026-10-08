import PageContainer from '@/components/layout/page-container';
import CampaignListingPage from '@/features/campaigns/components/campaign-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { CampaignWizardTrigger } from '@/features/campaigns/components/campaign-wizard';

export const metadata = {
  title: 'Dashboard: Ringkampanjer'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CampaignsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Ringkampanjer'
      pageDescription='Konfigurera och övervaka utgående röstkampanjer (minst 4 timmars schemafönster).'
      pageHeaderAction={<CampaignWizardTrigger />}
    >
      <CampaignListingPage />
    </PageContainer>
  );
}