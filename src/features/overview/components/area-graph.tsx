'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import React from 'react';

// MOCK — kopplas till /api/usage vid wiring-pass (samtal per dag).
const chartData = [
  { day: '22/9', samtal: 186, besvarade: 121 },
  { day: '23/9', samtal: 305, besvarade: 198 },
  { day: '24/9', samtal: 237, besvarade: 164 },
  { day: '25/9', samtal: 173, besvarade: 129 },
  { day: '26/9', samtal: 209, besvarade: 141 },
  { day: '29/9', samtal: 254, besvarade: 177 },
  { day: '30/9', samtal: 312, besvarade: 203 },
  { day: '1/10', samtal: 288, besvarade: 196 },
  { day: '2/10', samtal: 341, besvarade: 228 },
  { day: '3/10', samtal: 296, besvarade: 205 }
];

const chartConfig = {
  samtal: {
    label: 'Samtal',
    color: 'var(--chart-1)'
  },
  besvarade: {
    label: 'Besvarade',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Samtal per dag
          <Badge variant='outline'>
            <Icons.trendingUp />
            +8,1 %
          </Badge>
        </CardTitle>
        <CardDescription>Genomförda vs besvarade samtal — senaste dagarna</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis
              dataKey='day'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <DottedBackgroundPattern config={chartConfig} />
            </defs>
            <Area
              dataKey='besvarade'
              type='natural'
              fill='url(#dotted-background-pattern-besvarade)'
              fillOpacity={0.4}
              stroke='var(--color-besvarade)'
              stackId='a'
              strokeWidth={0.8}
            />
            <Area
              dataKey='samtal'
              type='natural'
              fill='url(#dotted-background-pattern-samtal)'
              fillOpacity={0.4}
              stroke='var(--color-samtal)'
              stackId='a'
              strokeWidth={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

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
