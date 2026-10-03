'use client';

import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { KanbanColumn } from '@/components/ui/kanban';
import type { CallRecord } from '../utils/store';
import { CallCard } from './call-card';
import { useI18n } from '@/lib/i18n';

const COLUMN_CONFIG: Record<
  string,
  { titleKey: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  pending: { titleKey: 'kanban.pending', icon: Icons.clock, color: 'text-yellow-500' },
  ringing: { titleKey: 'kanban.ringing', icon: Icons.phoneOutgoing, color: 'text-blue-500' },
  connected: { titleKey: 'kanban.connected', icon: Icons.phoneIncoming, color: 'text-green-500' },
  completed: { titleKey: 'kanban.completed', icon: Icons.check, color: 'text-purple-500' }
};

interface CallColumnProps {
  value: string;
  tasks: CallRecord[];
}

export function CallColumn({ value, tasks }: CallColumnProps) {
  const { t } = useI18n();
  const config = COLUMN_CONFIG[value] ?? { titleKey: value, icon: Icons.circle, color: '' };
  const Icon = config.icon;

  return (
    <KanbanColumn value={value} className='w-full shrink-0 md:w-[320px]' disabled>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className='text-sm font-semibold'>{t(config.titleKey)}</span>
          <Badge variant='secondary' className='pointer-events-none rounded-sm'>
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className='flex flex-col gap-2 p-0.5 min-h-[200px]'>
        {tasks.length === 0 ? (
          <div className='flex-1 flex items-center justify-center text-muted-foreground text-sm py-8'>
            {t('kanban.no-calls')}
          </div>
        ) : (
          tasks.map((call) => <CallCard key={call.id} call={call} />)
        )}
      </div>
    </KanbanColumn>
  );
}
