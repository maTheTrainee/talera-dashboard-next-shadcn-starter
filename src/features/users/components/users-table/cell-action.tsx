'use client';
import { Icons } from '@/components/icons';
import type { Lead } from '../../api/types';

interface CellActionProps {
  data: Lead;
}

export function CellAction({ data }: CellActionProps) {
  return (
    <div className='flex items-center gap-1'>
      <button className='p-1.5 rounded hover:bg-muted transition-colors' title='Visa transkription'>
        <Icons.chat className='h-4 w-4' />
      </button>
      <button
        className='p-1.5 rounded hover:bg-muted transition-colors'
        title='Kopiera nummer'
        onClick={() => navigator.clipboard.writeText(data.phoneNumber)}
      >
        <Icons.copy className='h-4 w-4' />
      </button>
    </div>
  );
}
