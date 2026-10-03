'use client';

import { Cell, LabelList, Pie, PieChart, Tooltip } from 'recharts';

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

const pieConfigOutbound = {
  booked: {
    label: 'Bokade möten',
    color: 'var(--chart-1)'
  },
  answered: {
    label: 'Svarade samtal',
    color: 'var(--chart-2)'
  },
  voicemail: {
    label: 'Röstbrevlåda',
    color: 'var(--chart-3)'
  },
  missed: {
    label: 'Missade',
    color: 'var(--chart-4)'
  },
  busy: {
    label: 'Upptagna',
    color: 'var(--chart-5)'
  }
} satisfies ChartConfig;

const pieConfigInbound = {
  resolved: {
    label: 'Lösta ärenden',
    color: 'var(--chart-1)'
  },
  answered: {
    label: 'Svarade samtal',
    color: 'var(--chart-2)'
  },
  queued: {
    label: 'Köade',
    color: 'var(--chart-3)'
  },
  missed: {
    label: 'Missade',
    color: 'var(--chart-4)'
  }
} satisfies ChartConfig;

export function OverviewPieChart() {
  const { t } = useI18n();
  const { campaignType } = useCampaignType();

  const chartData =
    campaignType === 'outbound'
      ? [
          { name: 'booked', value: 156, fill: 'var(--color-booked)' },
          { name: 'answered', value: 736, fill: 'var(--color-answered)' },
          { name: 'voicemail', value: 189, fill: 'var(--color-voicemail)' },
          { name: 'missed', value: 112, fill: 'var(--color-missed)' },
          { name: 'busy', value: 54, fill: 'var(--color-busy)' }
        ]
      : [
          { name: 'resolved', value: 1987, fill: 'var(--color-resolved)' },
          { name: 'answered', value: 354, fill: 'var(--color-answered)' },
          { name: 'queued', value: 89, fill: 'var(--color-queued)' },
          { name: 'missed', value: 23, fill: 'var(--color-missed)' }
        ];

  const config = campaignType === 'outbound' ? pieConfigOutbound : pieConfigInbound;

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle className='flex items-center justify-between'>
          {campaignType === 'outbound' ? 'Utfall (Utgående)' : 'Utfall (Ingående)'}
          <Badge variant='outline'>
            <Icons.trendingUp />
            {campaignType === 'outbound' ? '+5.2%' : '+12.1%'}
          </Badge>
        </CardTitle>
        <CardDescription>
          {campaignType === 'outbound'
            ? 'Fördelning av samtalsutfall den här veckan'
            : 'Fördelning av inkommande samtal den här veckan'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <ChartContainer
          config={config}
          className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey='value' hideLabel />} />
            <Pie
              data={chartData}
              innerRadius={40}
              dataKey='value'
              cornerRadius={8}
              paddingAngle={4}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey='value'
                stroke='none'
                fontSize={12}
                fontWeight={500}
                fill='currentColor'
                formatter={(value) => String(value ?? '')}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
