'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { CampaignTypeToggle, useCampaignType, CampaignProvider } from './campaign-toggle';
import { OverviewStats } from './overview-stats';
import { OverviewAreaChart } from './overview-area-chart';
import { OverviewBarChart } from './overview-bar-chart';
import { OverviewPieChart } from './overview-pie-chart';
import { RecentEvents } from './recent-events';
import { overviewStatsQueryOptions } from '../api/queries';
import { useI18n } from '@/lib/i18n';
import { Suspense } from 'react';

interface OverviewClientProps {
  campaignType: 'outbound' | 'inbound';
}

export function OverviewClient({ campaignType }: OverviewClientProps) {
  return (
    <CampaignProvider defaultType={campaignType}>
      <OverviewInner />
    </CampaignProvider>
  );
}

function OverviewInner() {
  const { campaignType } = useCampaignType();
  const { t } = useI18n();
  const { data } = useSuspenseQuery(overviewStatsQueryOptions({ campaignType }));

  if (!data?.stats) return null;

  return (
    <div className='space-y-4'>
      <OverviewStats stats={data.stats} />
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='col-span-4'>
          <OverviewBarChart />
        </div>
        <div className='col-span-4 md:col-span-3'>
          <Suspense fallback={<div className='h-[400px] animate-pulse bg-muted/50 rounded-lg' />}>
            <RecentEvents events={data.events} />
          </Suspense>
        </div>
        <div className='col-span-4'>
          <OverviewAreaChart />
        </div>
        <div className='col-span-4 md:col-span-3'>
          <OverviewPieChart />
        </div>
      </div>
    </div>
  );
}
