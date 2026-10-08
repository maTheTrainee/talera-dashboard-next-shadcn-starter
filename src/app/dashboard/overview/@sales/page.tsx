import { Suspense } from 'react';
import { delay } from '@/lib/delay';
import { UsageCard } from '@/features/overview/components/usage-card';

export default async function SalesStatsPage() {
  await delay(1000);
  return (
    <Suspense fallback={null}>
      <UsageCard />
    </Suspense>
  );
}
