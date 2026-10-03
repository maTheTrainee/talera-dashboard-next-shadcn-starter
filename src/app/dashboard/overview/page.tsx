import type { SearchParams } from 'nuqs/server';
import OverViewPage from '@/features/overview/components/overview';

export default async function OverviewPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <OverViewPage searchParams={searchParams} />;
}
