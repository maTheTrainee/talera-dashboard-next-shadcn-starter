import { auth } from '@clerk/nextjs/server';
import { getCapabilities, getTierDefinition } from '@/config/plans';
import { getTenantMetadata } from '@/lib/pb';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import React from 'react';

/**
 * Översikt — the dynamic voice-ops dashboard. Renders per the tenant's
 * packages: outbound (Minuter kvar, Genomförda samtal, Träffsäkerhet),
 * booking (Bokade möten), inbound (Besvarade/Missade samtal), internal
 * (Supportsamtal).
 */
export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const { orgId } = await auth();
  const tenant = await getTenantMetadata(orgId ?? '');
  const caps = getCapabilities(tenant.subscription_tiers);
  const tierLabels = tenant.subscription_tiers
    .map((t) => getTierDefinition(t).label)
    .join(' + ');

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Hej och välkommen tillbaka 👋</h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {caps.outbound && (
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Minuter kvar</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  2 000 min
                </CardTitle>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>i {tierLabels}-paketet</div>
                <div className='text-muted-foreground'>Minutpoolen tickar ner per samtal</div>
              </CardFooter>
            </Card>
          )}
          {caps.booking && (
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Bokade möten</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  23
                </CardTitle>
                <CardAction>
                  <Badge variant='outline'>
                    <Icons.trendingUp />
                    +12,5 %
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>
                  Uppåt denna vecka <Icons.trendingUp className='size-4' />
                </div>
                <div className='text-muted-foreground'>Möten bokade av AI-agenten</div>
              </CardFooter>
            </Card>
          )}
          {caps.outbound && (
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Genomförda samtal</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  412
                </CardTitle>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>68 % besvarade</div>
                <div className='text-muted-foreground'>Utgående samtal denna månad</div>
              </CardFooter>
            </Card>
          )}
          {caps.outbound && (
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Träffsäkerhet</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  8,4 %
                </CardTitle>
                <CardAction>
                  <Badge variant='outline'>
                    <Icons.trendingUp />
                    +1,2 %
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>
                  Stabil utveckling <Icons.trendingUp className='size-4' />
                </div>
                <div className='text-muted-foreground'>Bokat möte per genomfört samtal</div>
              </CardFooter>
            </Card>
          )}
          {caps.inbound && (
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Besvarade samtal</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  87
                </CardTitle>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>94 % svaratsfrekvens</div>
                <div className='text-muted-foreground'>Inkommande samtal denna månad</div>
              </CardFooter>
            </Card>
          )}
          {caps.inbound && (
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Missade samtal</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  6
                </CardTitle>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>Uppringda igen automatiskt</div>
                <div className='text-muted-foreground'>Inkommande samtal som gick till röstbrevlåda</div>
              </CardFooter>
            </Card>
          )}
          {caps.internal && (
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription>Supportsamtal</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  34
                </CardTitle>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>Guiden igenom manualen</div>
                <div className='text-muted-foreground'>Interna samtal med AI-assistenten</div>
              </CardFooter>
            </Card>
          )}
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'> {area_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales parallel routes */}
            {sales}
          </div>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 min-h-0 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
