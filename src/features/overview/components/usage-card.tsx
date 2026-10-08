'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { usageQueryOptions } from '../api/queries';

/**
 * Dagens minutpott — daily minute quota progress + dynamic overage liability
 * card (5,90 kr/min exkl. moms). Overage minutes are tracked by the
 * automation engine in PocketBase.
 */
export function UsageCard() {
  const { data } = useSuspenseQuery(usageQueryOptions());

  const limit = data.dailyMinuteLimit;
  const percent = limit == null ? 0 : Math.min(100, Math.round((data.minutesUsed / limit) * 100));
  const overLimit = data.overageMinutes > 0;

  return (
    <Card className='h-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Dagens minutpott</CardTitle>
          <Badge variant={overLimit ? 'destructive' : 'secondary'}>{data.tierLabel}</Badge>
        </div>
        <CardDescription>
          {limit == null
            ? 'Begränsad volym enligt offert (Enterprise).'
            : `${data.minutesUsed} av ${limit} minuter använda idag.`}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {limit != null && <Progress value={percent} className='h-2' />}
        {overLimit ? (
          <div className='space-y-1'>
            <p className='text-sm font-medium'>
              ⚠️ Dagens minutpott uppnådd. Överförbrukning aktiverad.
            </p>
            <p className='text-muted-foreground text-sm'>
              {data.overageMinutes} extra minuter ×{' '}
              {data.overageRateSekPerMin.toLocaleString('sv-SE')} kr/min (exkl. moms) ={' '}
              <span className='font-medium'>
                {data.liabilitySek.toLocaleString('sv-SE')} kr
              </span>
            </p>
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Överförbrukning prissätts med{' '}
            {data.overageRateSekPerMin.toLocaleString('sv-SE')} kr/min (exkl. moms) — samtal
            avbryts aldrig mitt i.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function UsageCardSkeleton() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <Skeleton className='h-5 w-40' />
        <Skeleton className='h-4 w-64' />
      </CardHeader>
      <CardContent className='space-y-3'>
        <Skeleton className='h-2 w-full' />
        <Skeleton className='h-4 w-full' />
      </CardContent>
    </Card>
  );
}