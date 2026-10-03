'use client';

import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useAppForm } from '@/lib/form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import {
  adminOrganizationConfigsQueryOptions,
  organizationConfigQueryOptions,
  updateOrganizationConfigMutationOptions
} from '../api/queries';
import type { OrganizationVoiceConfig } from '../api/types';
import { LoadingButton } from '@/components/ui/loading-button';
import { useOrganization } from '@clerk/nextjs';

export function AdminConfigDashboard() {
  const { t } = useI18n();
  const { organization } = useOrganization();
  const orgId = organization?.id;

  const { data: orgConfigs } = useSuspenseQuery(adminOrganizationConfigsQueryOptions());
  const { data: currentConfig } = orgId
    ? useSuspenseQuery(organizationConfigQueryOptions(orgId))
    : { data: null };
  const updateMutation = useMutation(updateOrganizationConfigMutationOptions());

  if (!orgId || !currentConfig) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{t('admin.title')}</h1>
            <p className='text-muted-foreground'>{t('admin.description')}</p>
          </div>
        </div>
        <div className='text-center py-8 text-muted-foreground'>
          Ingen konfiguration hittades för din organisation
        </div>
      </div>
    );
  }

  const updateConfig = async (
    section: 'callSchedule' | 'ultravox' | 'n8n' | 'limits' | 'features',
    data: Partial<OrganizationVoiceConfig[typeof section]>
  ) => {
    try {
      await updateMutation.mutateAsync({
        orgId: orgId!,
        data: { [section]: { ...currentConfig[section], ...data } }
      });
      toast.success(`${section} uppdaterad`);
    } catch {
      toast.error('Kunde inte uppdatera');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('admin.title')}</h1>
          <p className='text-muted-foreground'>{t('admin.description')}</p>
        </div>
        <Badge variant='default'>
          {currentConfig.campaignMode === 'outbound'
            ? 'Utgående'
            : currentConfig.campaignMode === 'inbound'
              ? 'Ingående'
              : 'Båda'}
        </Badge>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>{t('admin.tabs.overview')}</TabsTrigger>
          <TabsTrigger value='schedule'>{t('admin.tabs.schedule')}</TabsTrigger>
          <TabsTrigger value='ultravox'>{t('admin.tabs.ultravox')}</TabsTrigger>
          <TabsTrigger value='n8n'>{t('admin.tabs.n8n')}</TabsTrigger>
          <TabsTrigger value='limits'>{t('admin.tabs.limits')}</TabsTrigger>
          <TabsTrigger value='features'>{t('admin.tabs.features')}</TabsTrigger>
        </TabsList>

        <TabsContent value='overview'>
          <div className='grid gap-4 md:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.overview.campaignMode')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant='default' className='text-lg px-4 py-2'>
                  {currentConfig.campaignMode === 'outbound'
                    ? '📞 Utgående'
                    : currentConfig.campaignMode === 'inbound'
                      ? '📥 Ingående'
                      : '🔄 Båda'}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.overview.ultravoxStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-2'>
                  <span
                    className={`w-3 h-3 rounded-full ${currentConfig.ultravox.enabled && currentConfig.ultravox.apiKey ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span>
                    {currentConfig.ultravox.enabled && currentConfig.ultravox.apiKey
                      ? 'Konfigurerad'
                      : 'Ej konfigurerad'}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.overview.n8nStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-2'>
                  <span
                    className={`w-3 h-3 rounded-full ${currentConfig.n8n.enabled && currentConfig.n8n.apiKey ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span>
                    {currentConfig.n8n.enabled && currentConfig.n8n.apiKey
                      ? 'Konfigurerad'
                      : 'Ej konfigurerad'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='schedule'>
          <Card className='max-w-xl'>
            <CardHeader>
              <CardTitle>{t('admin.tabs.schedule')}</CardTitle>
              <CardDescription>{t('admin.schedule.description')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={currentConfig.callSchedule.enabled}
                  onCheckedChange={(checked) =>
                    updateConfig('callSchedule', {
                      ...currentConfig.callSchedule,
                      enabled: checked
                    })
                  }
                />
                <Label>{t('admin.schedule.enabled')}</Label>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='timezone'>{t('admin.schedule.timezone')}</Label>
                <Select
                  value={currentConfig.callSchedule.timezone ?? 'Europe/Stockholm'}
                  onValueChange={(value) =>
                    updateConfig('callSchedule', {
                      ...currentConfig.callSchedule,
                      timezone: value ?? 'Europe/Stockholm'
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Europe/Stockholm' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Europe/Stockholm'>Europe/Stockholm (CET/CEST)</SelectItem>
                    <SelectItem value='Europe/London'>Europe/London (GMT/BST)</SelectItem>
                    <SelectItem value='Europe/Berlin'>Europe/Berlin (CET/CEST)</SelectItem>
                    <SelectItem value='America/New_York'>America/New_York (EST/EDT)</SelectItem>
                    <SelectItem value='America/Los_Angeles'>
                      America/Los_Angeles (PST/PDT)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>{t('admin.schedule.allowedDays')}</Label>
                <div className='flex flex-wrap gap-2'>
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <label
                      key={day}
                      className='inline-flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted/50'
                    >
                      <input
                        type='checkbox'
                        checked={currentConfig.callSchedule.allowedDays.includes(day)}
                        onChange={(e) => {
                          const days = [...currentConfig.callSchedule.allowedDays];
                          if (e.target.checked) {
                            updateConfig('callSchedule', {
                              ...currentConfig.callSchedule,
                              allowedDays: [...days, day]
                            });
                          } else {
                            updateConfig('callSchedule', {
                              ...currentConfig.callSchedule,
                              allowedDays: days.filter((d) => d !== day)
                            });
                          }
                        }}
                        className='w-4 h-4 rounded border-input'
                      />
                      <span className='text-sm'>
                        {['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'][day]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='startHour'>{t('admin.schedule.startHour')}</Label>
                  <Input
                    id='startHour'
                    type='number'
                    min={0}
                    max={23}
                    value={currentConfig.callSchedule.startHour}
                    onChange={(e) =>
                      updateConfig('callSchedule', {
                        ...currentConfig.callSchedule,
                        startHour: parseInt(e.target.value)
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='endHour'>{t('admin.schedule.endHour')}</Label>
                  <Input
                    id='endHour'
                    type='number'
                    min={0}
                    max={23}
                    value={currentConfig.callSchedule.endHour}
                    onChange={(e) =>
                      updateConfig('callSchedule', {
                        ...currentConfig.callSchedule,
                        endHour: parseInt(e.target.value)
                      })
                    }
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='excludedDates'>{t('admin.schedule.excludedDates')}</Label>
                <Input
                  id='excludedDates'
                  placeholder='2026-12-25, 2026-12-26'
                  onChange={(e) =>
                    updateConfig('callSchedule', {
                      ...currentConfig.callSchedule,
                      excludedDates: e.target.value
                        .split(',')
                        .map((d) => d.trim())
                        .filter(Boolean)
                    })
                  }
                />
                <p className='text-sm text-muted-foreground'>
                  {t('admin.schedule.excludedDatesDesc')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='ultravox'>
          <Card className='max-w-2xl'>
            <CardHeader>
              <CardTitle>{t('admin.tabs.ultravox')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={currentConfig.ultravox.enabled}
                  onCheckedChange={(checked) =>
                    updateConfig('ultravox', { ...currentConfig.ultravox, enabled: checked })
                  }
                />
                <Label>{t('admin.ultravox.enabled')}</Label>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='apiKey'>{t('admin.ultravox.apiKey')}</Label>
                <Input
                  id='apiKey'
                  type='password'
                  placeholder='uv_...'
                  value={currentConfig.ultravox.apiKey || ''}
                  onChange={(e) =>
                    updateConfig('ultravox', { ...currentConfig.ultravox, apiKey: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='baseUrl'>{t('admin.ultravox.baseUrl')}</Label>
                <Input
                  id='baseUrl'
                  placeholder='https://api.ultravox.ai'
                  value={currentConfig.ultravox.baseUrl}
                  onChange={(e) =>
                    updateConfig('ultravox', { ...currentConfig.ultravox, baseUrl: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='defaultVoiceId'>{t('admin.ultravox.defaultVoiceId')}</Label>
                <Input
                  id='defaultVoiceId'
                  placeholder='voice_1'
                  value={currentConfig.ultravox.defaultVoiceId || ''}
                  onChange={(e) =>
                    updateConfig('ultravox', {
                      ...currentConfig.ultravox,
                      defaultVoiceId: e.target.value
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='defaultModel'>{t('admin.ultravox.defaultModel')}</Label>
                <Input
                  id='defaultModel'
                  placeholder='ultravox-v1'
                  value={currentConfig.ultravox.defaultModel || ''}
                  onChange={(e) =>
                    updateConfig('ultravox', {
                      ...currentConfig.ultravox,
                      defaultModel: e.target.value
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='webhookSecret'>{t('admin.ultravox.webhookSecret')}</Label>
                <Input
                  id='webhookSecret'
                  type='password'
                  placeholder='Secret för n8n callbacks'
                  value={currentConfig.ultravox.webhookSecret || ''}
                  onChange={(e) =>
                    updateConfig('ultravox', {
                      ...currentConfig.ultravox,
                      webhookSecret: e.target.value
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='n8n'>
          <Card className='max-w-2xl'>
            <CardHeader>
              <CardTitle>{t('admin.tabs.n8n')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={currentConfig.n8n.enabled}
                  onCheckedChange={(checked) =>
                    updateConfig('n8n', { ...currentConfig.n8n, enabled: checked })
                  }
                />
                <Label>{t('admin.n8n.enabled')}</Label>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='apiKey'>{t('admin.n8n.apiKey')}</Label>
                <Input
                  id='apiKey'
                  type='password'
                  placeholder='n8n API key'
                  value={currentConfig.n8n.apiKey || ''}
                  onChange={(e) =>
                    updateConfig('n8n', { ...currentConfig.n8n, apiKey: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='baseUrl'>{t('admin.n8n.baseUrl')}</Label>
                <Input
                  id='baseUrl'
                  placeholder='https://n8n.yourdomain.com'
                  value={currentConfig.n8n.baseUrl}
                  onChange={(e) =>
                    updateConfig('n8n', { ...currentConfig.n8n, baseUrl: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='webhookUrl'>{t('admin.n8n.webhookUrl')}</Label>
                <Input
                  id='webhookUrl'
                  placeholder='https://n8n.yourdomain.com/webhook/...'
                  value={currentConfig.n8n.webhookUrl || ''}
                  onChange={(e) =>
                    updateConfig('n8n', { ...currentConfig.n8n, webhookUrl: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='campaignTriggerWorkflowId'>
                  {t('admin.n8n.campaignTriggerWorkflowId')}
                </Label>
                <Input
                  id='campaignTriggerWorkflowId'
                  placeholder='workflow_campaign_trigger'
                  value={currentConfig.n8n.campaignTriggerWorkflowId || ''}
                  onChange={(e) =>
                    updateConfig('n8n', {
                      ...currentConfig.n8n,
                      campaignTriggerWorkflowId: e.target.value
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='quickDialWorkflowId'>{t('admin.n8n.quickDialWorkflowId')}</Label>
                <Input
                  id='quickDialWorkflowId'
                  placeholder='workflow_quick_dial'
                  value={currentConfig.n8n.quickDialWorkflowId || ''}
                  onChange={(e) =>
                    updateConfig('n8n', {
                      ...currentConfig.n8n,
                      quickDialWorkflowId: e.target.value
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='statusCallbackWorkflowId'>
                  {t('admin.n8n.statusCallbackWorkflowId')}
                </Label>
                <Input
                  id='statusCallbackWorkflowId'
                  placeholder='workflow_status_callback'
                  value={currentConfig.n8n.statusCallbackWorkflowId || ''}
                  onChange={(e) =>
                    updateConfig('n8n', {
                      ...currentConfig.n8n,
                      statusCallbackWorkflowId: e.target.value
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='limits'>
          <Card className='max-w-xl'>
            <CardHeader>
              <CardTitle>{t('admin.tabs.limits')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='maxConcurrentCalls'>{t('admin.limits.maxConcurrentCalls')}</Label>
                  <Input
                    id='maxConcurrentCalls'
                    type='number'
                    min={1}
                    value={currentConfig.limits.maxConcurrentCalls}
                    onChange={(e) =>
                      updateConfig('limits', {
                        ...currentConfig.limits,
                        maxConcurrentCalls: parseInt(e.target.value)
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='maxDailyMinutes'>{t('admin.limits.maxDailyMinutes')}</Label>
                  <Input
                    id='maxDailyMinutes'
                    type='number'
                    min={1}
                    value={currentConfig.limits.maxDailyMinutes}
                    onChange={(e) =>
                      updateConfig('limits', {
                        ...currentConfig.limits,
                        maxDailyMinutes: parseInt(e.target.value)
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='maxMonthlyMinutes'>{t('admin.limits.maxMonthlyMinutes')}</Label>
                  <Input
                    id='maxMonthlyMinutes'
                    type='number'
                    min={1}
                    value={currentConfig.limits.maxMonthlyMinutes}
                    onChange={(e) =>
                      updateConfig('limits', {
                        ...currentConfig.limits,
                        maxMonthlyMinutes: parseInt(e.target.value)
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='outboundMinuteCost'>{t('admin.limits.outboundMinuteCost')}</Label>
                  <Input
                    id='outboundMinuteCost'
                    type='number'
                    step='0.01'
                    min={0}
                    value={currentConfig.limits.outboundMinuteCost}
                    onChange={(e) =>
                      updateConfig('limits', {
                        ...currentConfig.limits,
                        outboundMinuteCost: parseFloat(e.target.value)
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='inboundMinuteCost'>{t('admin.limits.inboundMinuteCost')}</Label>
                  <Input
                    id='inboundMinuteCost'
                    type='number'
                    step='0.01'
                    min={0}
                    value={currentConfig.limits.inboundMinuteCost}
                    onChange={(e) =>
                      updateConfig('limits', {
                        ...currentConfig.limits,
                        inboundMinuteCost: parseFloat(e.target.value)
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='features'>
          <Card className='max-w-xl'>
            <CardHeader>
              <CardTitle>{t('admin.tabs.features')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {[
                {
                  key: 'liveTranscription',
                  label: t('admin.features.liveTranscription'),
                  desc: t('admin.features.liveTranscriptionDesc')
                },
                {
                  key: 'aiSummary',
                  label: t('admin.features.aiSummary'),
                  desc: t('admin.features.aiSummaryDesc')
                },
                {
                  key: 'callRecording',
                  label: t('admin.features.callRecording'),
                  desc: t('admin.features.callRecordingDesc')
                },
                {
                  key: 'voicemailDetection',
                  label: t('admin.features.voicemailDetection'),
                  desc: t('admin.features.voicemailDetectionDesc')
                },
                {
                  key: 'answeringMachineDetection',
                  label: t('admin.features.answeringMachineDetection'),
                  desc: t('admin.features.answeringMachineDetectionDesc')
                }
              ].map((opt) => (
                <div
                  key={opt.key}
                  className='flex items-center justify-between p-4 border rounded-lg'
                >
                  <div>
                    <p className='font-medium'>{opt.label}</p>
                    <p className='text-sm text-muted-foreground'>{opt.desc}</p>
                  </div>
                  <Switch
                    checked={currentConfig.features[opt.key as keyof typeof currentConfig.features]}
                    onCheckedChange={(checked) =>
                      updateConfig('features', { ...currentConfig.features, [opt.key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
