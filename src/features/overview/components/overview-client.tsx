'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { CampaignProvider, CampaignTypeToggle, useCampaignType } from './campaign-toggle';
import { OverviewStats } from './overview-stats';
import { OverviewAreaChart } from './overview-area-chart';
import { OverviewBarChart } from './overview-bar-chart';
import { OverviewPieChart } from './overview-pie-chart';
import { RecentEvents } from './recent-events';
import { overviewStatsQueryOptions } from '../api/queries';
import { useI18n } from '@/lib/i18n';
import { Suspense } from 'react';

export function OverviewStatsWrapper() {
  const { t } = useI18n();
  const { campaignType } = useCampaignType();
  const { data } = useSuspenseQuery(overviewStatsQueryOptions({ campaignType }));

  if (!data?.stats) return null;

  return (
    <CampaignProvider defaultType={campaignType}>
      <OverviewStats stats={data.stats} />
    </CampaignProvider>
  );
}

export function RecentEventsWrapper() {
  const { t } = useI18n();
  const { campaignType } = useCampaignType();
  const { data } = useSuspenseQuery(overviewStatsQueryOptions({ campaignType }));

  if (!data?.events) return null;

  return (
    <CampaignProvider defaultType={campaignType}>
      <RecentEvents events={data.events} />
    </CampaignProvider>
  );
}

export function OverviewChartsWrapper() {
  const { campaignType } = useCampaignType();

  return (
    <CampaignProvider defaultType={campaignType}>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='col-span-4'>
          <OverviewBarChart />
        </div>
        <div className='col-span-4 md:col-span-3'>
          <Suspense fallback={<div className='h-[400px] animate-pulse bg-muted/50 rounded-lg' />}>
            <RecentEventsWrapper />
          </Suspense>
        </div>
        <div className='col-span-4'>
          <OverviewAreaChart />
        </div>
        <div className='col-span-4 md:col-span-3'>
          <OverviewPieChart />
        </div>
      </div>
    </CampaignProvider>
  );
}
