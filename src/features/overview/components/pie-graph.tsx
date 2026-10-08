'use client';

import { LabelList, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

// MOCK — kopplas till /api/usage vid wiring-pass (utfallsfördelning).
// Semantisk färgskala: grön = vunnet, blå = nära, amber = på väg, grå = ingen
// signal, röd = förlorat.
const chartData = [
  { outcome: 'bokat', antal: 23, fill: '#22c55e' },
  { outcome: 'kvalificerad', antal: 41, fill: '#3b82f6' },
  { outcome: 'uppfoljning', antal: 67, fill: '#f59e0b' },
  { outcome: 'ej_svar', antal: 132, fill: '#94a3b8' },
  { outcome: 'nej_tack', antal: 149, fill: '#ef4444' }
];

const chartConfig = {
  antal: {
    label: 'Antal'
  },
  bokat: {
    label: 'Bokat möte',
    color: '#22c55e'
  },
  kvalificerad: {
    label: 'Kvalificerad prospekt',
    color: '#3b82f6'
  },
  uppfoljning: {
    label: 'Uppföljning',
    color: '#f59e0b'
  },
  ej_svar: {
    label: 'Ej svar',
    color: '#94a3b8'
  },
  nej_tack: {
    label: 'Nej tack',
    color: '#ef4444'
  }
} satisfies ChartConfig;

export function PieGraph() {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>
          Utfallsfördelning
          <Badge variant='outline'>
            <Icons.trendingUp />
            +5,2 %
          </Badge>
        </CardTitle>
        <CardDescription>Senaste 30 dagarna</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <ChartContainer
          config={chartConfig}
          className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent labelKey='outcome' nameKey='antal' />} />
            <Pie
              data={chartData}
              innerRadius={30}
              dataKey='antal'
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey='antal'
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
