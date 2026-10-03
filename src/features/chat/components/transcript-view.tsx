'use client';

import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTranscriptStore } from '../utils/store';
import type { CallTranscript, TranscriptMessage } from '../utils/types';

interface TranscriptViewProps {
  transcript: CallTranscript;
}

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

const statusLabels: Record<
  string,
  { sv: string; en: string; icon: React.ComponentType<{ className?: string }> }
> = {
  completed: { sv: 'Slutförd', en: 'Completed', icon: Icons.check },
  ringing: { sv: 'Ringer...', en: 'Ringing...', icon: Icons.phoneOutgoing },
  connected: { sv: 'Aktivt Samtal 🎙️', en: 'Active Call 🎙️', icon: Icons.phoneIncoming },
  missed: { sv: 'Missat', en: 'Missed', icon: Icons.alertCircle },
  voicemail: { sv: 'Röstbrevlåda', en: 'Voicemail', icon: Icons.chat }
};

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const { t } = useI18n();
  const { connectLiveCall, disconnectLiveCall } = useTranscriptStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsConnectedRef = useRef(false);

  const outcome = transcript.outcome
    ? outcomeLabels[transcript.outcome as keyof typeof outcomeLabels]
    : { sv: '—', en: '—', variant: 'outline' as const };
  const campaignType = campaignTypeLabels[transcript.campaignType] ?? {
    sv: transcript.campaignType,
    en: transcript.campaignType,
    icon: Icons.phone
  };
  const status = statusLabels[transcript.status] ?? {
    sv: transcript.status,
    en: transcript.status,
    icon: Icons.circle
  };
  const StatusIcon = status.icon;
  const isLive = transcript.isLive;
  const isConnected = transcript.status === 'connected';
  const isRinging = transcript.status === 'ringing';

  // Auto-connect to live call when selected
  useEffect(() => {
    if ((isRinging || isConnected) && transcript.joinUrl && !wsConnectedRef.current) {
      setIsConnecting(true);
      connectLiveCall(transcript.id, transcript.joinUrl);
      wsConnectedRef.current = true;
      setIsConnecting(false);
    } else if (!isRinging && !isConnected && wsConnectedRef.current) {
      disconnectLiveCall(transcript.id);
      wsConnectedRef.current = false;
    }
  }, [
    transcript.id,
    transcript.status,
    transcript.joinUrl,
    isRinging,
    isConnected,
    connectLiveCall,
    disconnectLiveCall
  ]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.messages.length]);

  return (
    <div className='flex flex-col h-full'>
      <Card className='mb-4'>
        <CardHeader className='pb-2'>
          <div className='flex items-start justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2 flex-wrap'>
                {transcript.customerName}
                <campaignType.icon className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-normal text-muted-foreground'>{campaignType.sv}</span>
                {isLive && (
                  <>
                    {isRinging && (
                      <Badge variant='default' className='flex items-center gap-1'>
                        <Icons.phoneOutgoing className='h-3 w-3 animate-pulse' />
                        {t('kanban.ringing')}
                      </Badge>
                    )}
                    {isConnected && (
                      <Badge
                        variant='default'
                        className='flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      >
                        <Icons.mic className='h-3 w-3' />
                        Live
                      </Badge>
                    )}
                  </>
                )}
              </CardTitle>
              <CardDescription className='flex items-center gap-4 text-sm flex-wrap'>
                <span className='flex items-center gap-1'>{transcript.phoneNumber}</span>
                {transcript.duration && (
                  <span className='flex items-center gap-1'>
                    <Icons.clock className='h-3.5 w-3.5' />
                    {transcript.duration}
                  </span>
                )}
                <Badge variant={outcome.variant} className='gap-1'>
                  {outcome.sv}
                </Badge>
              </CardDescription>
            </div>
            <div className='text-right text-sm text-muted-foreground'>
              <p>
                {new Date(transcript.startedAt).toLocaleString('sv-SE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {isLive && transcript.currentState && (
                <p className='flex items-center justify-end gap-1 text-xs'>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${transcript.currentState === 'speaking' ? 'bg-green-500 animate-pulse' : transcript.currentState === 'thinking' ? 'bg-yellow-500 animate-bounce' : 'bg-gray-400'}`}
                  />
                  {transcript.currentState}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        {transcript.aiSummary && (
          <CardContent className='pt-0'>
            <div className='p-3 bg-muted/30 rounded-lg border'>
              <p className='text-sm font-medium text-muted-foreground mb-1'>AI Sammanfattning</p>
              <p className='text-sm'>{transcript.aiSummary}</p>
            </div>
          </CardContent>
        )}
      </Card>
      <div className='flex-1 overflow-y-auto space-y-4 px-1'>
        {transcript.messages.length === 0 ? (
          <div className='flex items-center justify-center h-full text-muted-foreground'>
            {isLive ? 'Väntar på samtal...' : 'Ingen transkription tillgänglig'}
          </div>
        ) : (
          <>
            {transcript.messages.map((message, index) => (
              <TranscriptMessageBubble key={message.id} message={message} index={index} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}

interface TranscriptMessageBubbleProps {
  message: TranscriptMessage;
  index: number;
}

function TranscriptMessageBubble({ message, index }: TranscriptMessageBubbleProps) {
  const { t } = useI18n();
  const isAI = message.role === 'agent';
  const isStreaming = message.isStreaming;

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 transition-colors ${
          isAI ? 'bg-muted rounded-bl-sm' : 'bg-primary text-primary-foreground rounded-br-sm'
        } ${isStreaming ? 'ring-2 ring-primary/50' : ''}`}
      >
        <div className='flex items-center gap-2 mb-1'>
          <span
            className={`text-xs font-medium ${isAI ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}
          >
            {isAI ? '🤖 AI Agent' : '👤 Prospekt'}
          </span>
          <span
            className={`text-[10px] ${isAI ? 'text-muted-foreground/70' : 'text-primary-foreground/50'}`}
          >
            {message.timestamp}
          </span>
          {isStreaming && (
            <span className='text-[10px] text-primary animate-pulse flex items-center gap-1'>
              <span className='w-1.5 h-1.5 bg-primary rounded-full animate-pulse' />
              Strömmar...
            </span>
          )}
        </div>
        <p className='text-sm whitespace-pre-wrap'>{message.text}</p>
      </div>
    </div>
  );
}
