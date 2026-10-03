'use client';

import { useCallback, useRef } from 'react';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { useCallStore } from '../utils/store';
import { CallColumn } from './board-column';
import { CallCard } from './call-card';
import { createRestrictToContainer } from '../utils/restrict-to-container';
import { useI18n } from '@/lib/i18n';

export function KanbanBoard() {
  const { columns } = useCallStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- factory function, stable after mount
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );

  const columnOrder: Array<keyof typeof columns> = ['pending', 'ringing', 'connected', 'completed'];

  return (
    <div ref={containerRef} className='h-[calc(100vh-12rem)]'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>{t('kanban.title')}</h2>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <span className='flex items-center gap-1'>
            <span className='w-2 h-2 rounded-full bg-yellow-500' />I Kö
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-2 h-2 rounded-full bg-blue-500' />
            Ringer
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-2 h-2 rounded-full bg-green-500' />
            Aktivt
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-2 h-2 rounded-full bg-purple-500' />
            Slutförda
          </span>
        </div>
      </div>
      <Kanban
        value={columns}
        onValueChange={() => {}} // Disabled - read only
        getItemValue={(item) => item.id}
        modifiers={[restrictToBoard]}
        autoScroll={false}
        // Disable drag by not providing onValueChange handler properly
      >
        <div className='w-full overflow-x-auto rounded-md pb-4'>
          <KanbanBoardPrimitive className='flex flex-col items-start gap-4 md:flex-row h-[calc(100%-60px)]'>
            {columnOrder.map((columnValue) => (
              <CallColumn key={columnValue} value={columnValue} tasks={columns[columnValue]} />
            ))}
          </KanbanBoardPrimitive>
        </div>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const columnValue = String(value);
              const tasks = columns[columnValue as keyof typeof columns] ?? [];
              return <CallColumn value={columnValue} tasks={tasks} />;
            }

            const call = Object.values(columns)
              .flat()
              .find((call) => call.id === String(value));

            if (!call) return null;
            return <CallCard call={call} />;
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
