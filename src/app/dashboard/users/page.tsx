import PageContainer from '@/components/layout/page-container';
import LeadsListingPage from '@/features/users/components/user-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { usersInfoContent } from '@/features/users/info-content';

export const metadata = {
  title: 'Dashboard: Mottagare & Prospekt'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function UsersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Mottagare & Prospekt'
      pageDescription='Hantera och övervaka alla prospekt och samtal'
      infoContent={usersInfoContent}
    >
      <LeadsListingPage />
    </PageContainer>
  );
}
