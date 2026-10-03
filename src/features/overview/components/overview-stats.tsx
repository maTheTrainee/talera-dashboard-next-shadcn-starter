'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import { useCampaignType } from './campaign-toggle';
import type { OverviewStats } from '../api/types';

interface OverviewStatsProps {
  stats: OverviewStats;
}

export function OverviewStats({ stats }: OverviewStatsProps) {
  const { t } = useI18n();
  const { campaignType } = useCampaignType();

  const outboundCards = [
    {
      label: t('overview.remaining-balance'),
      value: stats.remainingBalance.toLocaleString('sv-SE'),
      suffix: t('common.minutes'),
      icon: Icons.creditCard,
      trend: '+12.5%',
      trendIcon: Icons.trendingUp,
      trendVariant: 'default' as const,
      description: t('overview.remaining-balance') + ' för denna månad'
    },
    {
      label: t('overview.called-numbers'),
      value: stats.calledNumbers.toLocaleString('sv-SE'),
      icon: Icons.phoneOutgoing,
      trend: '+8.2%',
      trendIcon: Icons.trendingUp,
      trendVariant: 'default' as const,
      description: 'Totalt ringda nummer den här veckan'
    },
    {
      label: t('overview.answered-calls'),
      value: stats.answeredCalls.toLocaleString('sv-SE'),
      icon: Icons.phoneIncoming,
      trend: '+5.1%',
      trendIcon: Icons.trendingUp,
      trendVariant: 'default' as const,
      description: 'Svarade samtal den här veckan'
    },
    {
      label: t('overview.booked-meetings'),
      value: stats.bookedMeetings.toLocaleString('sv-SE'),
      icon: Icons.check,
      trend: '+15.3%',
      trendIcon: Icons.trendingUp,
      trendVariant: 'default' as const,
      description: 'Bokade möten den här veckan'
    }
  ];

  const inboundCards = [
    {
      label: t('overview.active-lines'),
      value: stats.activeLines.toLocaleString('sv-SE'),
      suffix: '',
      icon: Icons.phoneIncoming,
      trend: '+2',
      trendIcon: Icons.trendingUp,
      trendVariant: 'default' as const,
      description: 'Aktiva inkommande linjer just nu'
    },
    {
      label: t('overview.received-calls'),
      value: stats.receivedCalls.toLocaleString('sv-SE'),
      suffix: '',
      icon: Icons.phone,
      trend: '+12.8%',
      trendIcon: Icons.trendingUp,
      trendVariant: 'default' as const,
      description: 'Mottagna samtal den här veckan'
    },
    {
      label: t('overview.answered-calls'),
      value: stats.answeredCalls.toLocaleString('sv-SE'),
      suffix: '',
      icon: Icons.circleCheck,
      trend: '+9.4%',
      trendIcon: Icons.trendingUp,
      trendVariant: 'default' as const,
      description: 'Svarade samtal den här veckan'
    },
    {
      label: t('overview.resolved-issues'),
      value: stats.resolvedIssues.toLocaleString('sv-SE'),
      suffix: '',
      icon: Icons.check,
      trend: '+18.2%',
      trendIcon: Icons.trendingUp,
      trendVariant: 'default' as const,
      description: 'Lösta ärenden den här veckan'
    }
  ];

  const cards = campaignType === 'outbound' ? outboundCards : inboundCards;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      {cards.map((card, index) => (
        <Card key={index} className='@container/card'>
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2'>
              {card.value}
              {card.suffix && (
                <span className='text-sm font-normal text-muted-foreground'>{card.suffix}</span>
              )}
            </CardTitle>
            <CardAction>
              <Badge variant='outline' className='gap-1'>
                <card.trendIcon className='size-3.5' />
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start gap-1.5 text-sm'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              {card.description} <card.trendIcon className='size-4' />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
