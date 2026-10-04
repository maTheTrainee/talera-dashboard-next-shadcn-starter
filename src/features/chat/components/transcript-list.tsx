'use client';

import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import type { CallTranscript } from '../utils/types';

interface TranscriptListProps {
  transcripts: CallTranscript[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const statusLabels: Record<
  string,
  {
    sv: string;
    en: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  completed: { sv: 'Slutförd', en: 'Completed', variant: 'secondary', icon: Icons.check },
  ringing: { sv: 'Ringer...', en: 'Ringing...', variant: 'default', icon: Icons.phoneOutgoing },
  connected: {
    sv: 'Aktivt Samtal 🎙️',
    en: 'Active Call 🎙️',
    variant: 'default',
    icon: Icons.phoneIncoming
  },
  missed: { sv: 'Missat', en: 'Missed', variant: 'destructive', icon: Icons.alertCircle },
  voicemail: { sv: 'Röstbrevlåda', en: 'Voicemail', variant: 'outline', icon: Icons.chat }
};

const outcomeLabels: Record<
  string,
  {
    sv: string;
    en: string;
    variant: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  }
> = {
  booked: { sv: 'Bokat 🚀', en: 'Booked 🚀', variant: 'default' },
  answered: { sv: 'Svarat', en: 'Answered', variant: 'secondary' },
  missed: { sv: 'Missat', en: 'Missed', variant: 'destructive' },
  voicemail: { sv: 'Röstbrevlåda', en: 'Voicemail', variant: 'outline' },
  busy: { sv: 'Upptaget', en: 'Busy', variant: 'outline' },
  resolved: { sv: 'Löst ✅', en: 'Resolved ✅', variant: 'default' }
};

const campaignTypeLabels: Record<
  string,
  { sv: string; en: string; icon: React.ComponentType<{ className?: string }> }
> = {
  outbound: { sv: 'Utgående', en: 'Outbound', icon: Icons.phoneOutgoing },
  inbound: { sv: 'Ingående', en: 'Inbound', icon: Icons.phoneIncoming }
};

export function TranscriptList({ transcripts, selectedId, onSelect }: TranscriptListProps) {
  const { t } = useI18n();

  return (
    <div className='flex-1 overflow-y-auto space-y-2'>
      {transcripts.length === 0 ? (
        <div className='text-center py-8 text-muted-foreground'>Inga samtal hittades</div>
      ) : (
        transcripts.map((transcript) => {
          const status = statusLabels[transcript.status] ?? {
            sv: transcript.status,
            en: transcript.status,
            variant: 'outline',
            icon: Icons.circle
          };
          const outcome = transcript.outcome
            ? outcomeLabels[transcript.outcome as keyof typeof outcomeLabels]
            : { sv: '—', en: '—', variant: 'outline' as const };
          const campaignType = campaignTypeLabels[transcript.campaignType] ?? {
            sv: transcript.campaignType,
            en: transcript.campaignType,
            icon: Icons.phone
          };
          const StatusIcon = status.icon;
          const isLive = transcript.isLive;
          const isSelected = selectedId === transcript.id;

          return (
            <button
              key={transcript.id}
              onClick={() => onSelect(transcript.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors relative ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-muted/50 bg-background'
              }`}
            >
              {/* Live indicator pulse */}
              {isLive && transcript.status === 'connected' && (
                <span
                  className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse'
                  aria-label='Live samtal'
                />
              )}
              {isLive && transcript.status === 'ringing' && (
                <span
                  className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse'
                  aria-label='Ringer'
                />
              )}

              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isLive ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-primary/10'
                      }`}
                    >
                      <StatusIcon
                        className={`h-4 w-4 ${isLive ? 'text-yellow-600 dark:text-yellow-400' : isSelected ? 'text-primary-foreground' : 'text-primary'}`}
                      />
                    </div>
                    <div className='min-w-0'>
                      <p
                        className={`font-medium truncate ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}
                      >
                        {transcript.customerName}
                      </p>
                      <p
                        className={`text-sm truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                      >
                        {transcript.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <div className='mt-2 flex items-center gap-2 text-xs'>
                    {transcript.duration && (
                      <span
                        className={`flex items-center gap-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                      >
                        <Icons.clock className='h-3 w-3' />
                        {transcript.duration}
                      </span>
                    )}
                    <span
                      className={`flex items-center gap-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                    >
                      <Icons.calendar className='h-3 w-3' />
                      {new Date(transcript.startedAt).toLocaleDateString('sv-SE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className='mt-2 flex items-center justify-end gap-2'>
                {transcript.outcome && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : outcome.variant === 'default'
                          ? 'bg-primary/10 text-primary'
                          : outcome.variant === 'secondary'
                            ? 'bg-secondary/10 text-secondary-foreground'
                            : outcome.variant === 'destructive'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {outcome.sv}
                  </span>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : status.variant === 'default'
                        ? 'bg-primary/10 text-primary'
                        : status.variant === 'secondary'
                          ? 'bg-secondary/10 text-secondary-foreground'
                          : status.variant === 'destructive'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <StatusIcon
                    className={`h-3 w-3 ${isSelected ? 'text-primary-foreground' : ''}`}
                  />
                  {status.sv}
                </span>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
