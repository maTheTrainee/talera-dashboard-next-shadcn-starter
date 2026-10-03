'use client';

import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

const CustomBar = (props: React.SVGProps<SVGRectElement> & { dataKey?: string }) => {
  const { fill, x, y, width, height, dataKey, ...rest } = props;
  const radius = 4;

  return (
    <>
      <rect
        rx={radius}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke='none'
        fill={fill}
        {...rest}
      />
    </>
  );
};

export function OverviewBarChart() {
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
            {t('overview.outbound-daily-distribution')}
            <Badge variant='outline'>
              <Icons.trendingUp />
              +12.5%
            </Badge>
          </CardTitle>
          <CardDescription>{t('overview.outbound-daily-summary')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigOutbound} className='h-[300px]'>
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey='day'
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator='dashed' hideLabel />}
              />
              <Bar
                dataKey='calls'
                fill='var(--color-calls)'
                shape={<CustomBar />}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey='answered'
                fill='var(--color-answered)'
                shape={<CustomBar />}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey='booked'
                fill='var(--color-booked)'
                shape={<CustomBar />}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
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
          {t('overview.inbound-daily-distribution')}
          <Badge variant='outline'>
            <Icons.trendingUp />
            +8.3%
          </Badge>
        </CardTitle>
        <CardDescription>{t('overview.inbound-daily-summary')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigInbound} className='h-[300px]'>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey='day'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dashed' hideLabel />}
            />
            <Bar
              dataKey='received'
              fill='var(--color-received)'
              shape={<CustomBar />}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey='answered'
              fill='var(--color-answered)'
              shape={<CustomBar />}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey='resolved'
              fill='var(--color-resolved)'
              shape={<CustomBar />}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
