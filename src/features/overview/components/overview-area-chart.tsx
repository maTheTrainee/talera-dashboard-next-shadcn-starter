'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { useCampaignType } from './campaign-toggle';
import React from 'react';

const chartConfigOutbound = {
  calls: {
    label: 'Ringda',
    color: 'var(--chart-1)'
  },
  answered: {
    label: 'Svarade',
    color: 'var(--chart-2)'
  },
  booked: {
    label: 'Bokade',
    color: 'var(--chart-3)'
  }
} satisfies ChartConfig;

const chartConfigInbound = {
  received: {
    label: 'Mottagna',
    color: 'var(--chart-1)'
  },
  answered: {
    label: 'Svarade',
    color: 'var(--chart-2)'
  },
  resolved: {
    label: 'Lösta',
    color: 'var(--chart-3)'
  }
} satisfies ChartConfig;

const DottedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
  const items = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.color])
  );
  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x='0'
          y='0'
          width='7'
          height='7'
          patternUnits='userSpaceOnUse'
        >
          <circle cx='5' cy='5' r='1.5' fill={value} opacity={0.5}></circle>
        </pattern>
      ))}
    </>
  );
};

export function OverviewAreaChart() {
  const { t } = useI18n();
  const { campaignType } = useCampaignType();

  if (campaignType === 'outbound') {
    const chartData = [
      { day: 'Mån', calls: 145, answered: 102, booked: 18 },
      { day: 'Tis', calls: 189, answered: 134, booked: 24 },
      { day: 'Ons', calls: 167, answered: 118, booked: 21 },
      { day: 'Tors', calls: 198, answered: 142, booked: 28 },
      { day: 'Fre', calls: 212, answered: 156, booked: 32 },
      { day: 'Lör', calls: 89, answered: 62, booked: 12 },
      { day: 'Sön', calls: 47, answered: 31, booked: 5 }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            {t('overview.outbound-calls-volume')}
            <Badge variant='outline'>
              <Icons.trendingUp />
              +12.5%
            </Badge>
          </CardTitle>
          <CardDescription>{t('overview.outbound-weekly-summary')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigOutbound} className='h-[300px]'>
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <DottedBackgroundPattern config={chartConfigOutbound} />
              </defs>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis
                dataKey='day'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                dataKey='calls'
                type='natural'
                fill='url(#dotted-background-pattern-calls)'
                fillOpacity={0.4}
                stroke='var(--color-calls)'
                stackId='a'
                strokeWidth={1.5}
              />
              <Area
                dataKey='answered'
                type='natural'
                fill='url(#dotted-background-pattern-answered)'
                fillOpacity={0.4}
                stroke='var(--color-answered)'
                stackId='a'
                strokeWidth={1.5}
              />
              <Area
                dataKey='booked'
                type='natural'
                fill='url(#dotted-background-pattern-booked)'
                fillOpacity={0.4}
                stroke='var(--color-booked)'
                stackId='a'
                strokeWidth={1.5}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { day: 'Mån', received: 312, answered: 287, resolved: 254 },
    { day: 'Tis', received: 378, answered: 351, resolved: 312 },
    { day: 'Ons', received: 345, answered: 318, resolved: 289 },
    { day: 'Tors', received: 398, answered: 372, resolved: 334 },
    { day: 'Fre', received: 423, answered: 398, resolved: 356 },
    { day: 'Lör', received: 189, answered: 167, resolved: 145 },
    { day: 'Sön', received: 156, answered: 134, resolved: 112 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          {t('overview.inbound-calls-volume')}
          <Badge variant='outline'>
            <Icons.trendingUp />
            +8.3%
          </Badge>
        </CardTitle>
        <CardDescription>{t('overview.inbound-weekly-summary')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigInbound} className='h-[300px]'>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <DottedBackgroundPattern config={chartConfigInbound} />
            </defs>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis
              dataKey='day'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey='received'
              type='natural'
              fill='url(#dotted-background-pattern-received)'
              fillOpacity={0.4}
              stroke='var(--color-received)'
              stackId='a'
              strokeWidth={1.5}
            />
            <Area
              dataKey='answered'
              type='natural'
              fill='url(#dotted-background-pattern-answered)'
              fillOpacity={0.4}
              stroke='var(--color-answered)'
              stackId='a'
              strokeWidth={1.5}
            />
            <Area
              dataKey='resolved'
              type='natural'
              fill='url(#dotted-background-pattern-resolved)'
              fillOpacity={0.4}
              stroke='var(--color-resolved)'
              stackId='a'
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
