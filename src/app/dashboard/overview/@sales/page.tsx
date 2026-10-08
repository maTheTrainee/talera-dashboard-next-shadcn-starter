import { delay } from '@/lib/delay';
import { PositiveEventsCard } from '@/features/overview/components/positive-events-card';

export default async function SalesStatsPage() {
  await delay(1000);
  return <PositiveEventsCard />;
}
