import { auth } from '@clerk/nextjs/server';
import { getCapabilities } from '@/config/plans';
import { delay } from '@/lib/delay';
import { getTenantMetadata } from '@/lib/pb';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStatsPage() {
  await delay(1000);
  // Bokningar per vecka visas bara när paketet omfattar bokning.
  const { orgId } = await auth();
  const tenant = await getTenantMetadata(orgId ?? '');
  const caps = getCapabilities(tenant.subscription_tiers);
  if (!caps.booking) return null;
  return <BarGraph />;
}
