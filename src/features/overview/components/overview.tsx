import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { overviewStatsQueryOptions } from '../api/queries';
import {
  OverviewStatsWrapper,
  RecentEventsWrapper,
  OverviewChartsWrapper
} from './overview-client';
import type { SearchParams } from 'nuqs/server';

export default async function OverViewPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  searchParamsCache.parse(params);

  const campaignType =
    (searchParamsCache.get('campaignType') as 'outbound' | 'inbound') ?? 'outbound';

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(overviewStatsQueryOptions({ campaignType }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight'>Hej, Välkommen tillbaka 👋</h2>
          </div>
          <Tabs defaultValue='overview' className='space-y-4'>
            <TabsList>
              <TabsTrigger value='overview'>Översikt</TabsTrigger>
              <TabsTrigger value='analytics' disabled>
                Analys
              </TabsTrigger>
            </TabsList>
            <TabsContent value='overview' className='space-y-4'>
              <OverviewStatsWrapper />
              <OverviewChartsWrapper />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </HydrationBoundary>
  );
}
