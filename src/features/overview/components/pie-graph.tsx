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
const chartData = [
  { outcome: 'bokat', antal: 23, fill: 'var(--color-bokat)' },
  { outcome: 'kvalificerad', antal: 41, fill: 'var(--color-kvalificerad)' },
  { outcome: 'uppfoljning', antal: 67, fill: 'var(--color-uppfoljning)' },
  { outcome: 'ej_svar', antal: 132, fill: 'var(--color-ej_svar)' },
  { outcome: 'nej_tack', antal: 149, fill: 'var(--color-nej_tack)' }
];

const chartConfig = {
  antal: {
    label: 'Antal'
  },
  bokat: {
    label: 'Bokat möte',
    color: 'var(--chart-1)'
  },
  kvalificerad: {
    label: 'Kvalificerad prospekt',
    color: 'var(--chart-2)'
  },
  uppfoljning: {
    label: 'Uppföljning',
    color: 'var(--chart-3)'
  },
  ej_svar: {
    label: 'Ej svar',
    color: 'var(--chart-4)'
  },
  nej_tack: {
    label: 'Nej tack',
    color: 'var(--chart-5)'
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
            <ChartTooltip content={<ChartTooltipContent nameKey='antal' hideLabel />} />
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
