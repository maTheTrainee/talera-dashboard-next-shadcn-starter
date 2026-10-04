import PageContainer from '@/components/layout/page-container';
import CampaignsListingPage from '@/features/campaigns/components/campaigns-listing';
import { CampaignStarter } from '@/features/campaigns/components/campaign-starter-client';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Kampanjer'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CampaignsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer pageTitle='Kampanjer' pageDescription='Skapa och övervaka ringkampanjer'>
      <div className='space-y-6'>
        {/* Create Campaign Section */}
        <CampaignStarter />

        {/* Campaigns Listing Section */}
        <CampaignsListingPage />
      </div>
    </PageContainer>
  );
}
