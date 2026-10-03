'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import { useState, createContext, useContext, ReactNode } from 'react';

type CampaignType = 'outbound' | 'inbound';

interface CampaignContextType {
  campaignType: CampaignType;
  setCampaignType: (type: CampaignType) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({
  children,
  defaultType = 'outbound'
}: {
  children: ReactNode;
  defaultType?: CampaignType;
}) {
  const [campaignType, setCampaignType] = useState<CampaignType>(defaultType);

  return (
    <CampaignContext.Provider value={{ campaignType, setCampaignType }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaignType() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaignType must be used within a CampaignProvider');
  }
  return context;
}

export function CampaignTypeToggle() {
  const { campaignType, setCampaignType } = useCampaignType();
  const { t } = useI18n();

  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm font-medium text-muted-foreground'>
        {t('overview.campaign-type')}
      </span>
      <div className='flex bg-muted rounded-lg p-1'>
        <Button
          variant={campaignType === 'outbound' ? 'default' : 'ghost'}
          size='sm'
          onClick={() => setCampaignType('outbound')}
          className='gap-1'
        >
          <Icons.phoneOutgoing className='h-3.5 w-3.5' />
          {t('overview.outbound')}
        </Button>
        <Button
          variant={campaignType === 'inbound' ? 'default' : 'ghost'}
          size='sm'
          onClick={() => setCampaignType('inbound')}
          className='gap-1'
        >
          <Icons.phoneIncoming className='h-3.5 w-3.5' />
          {t('overview.inbound')}
        </Button>
      </div>
    </div>
  );
}
