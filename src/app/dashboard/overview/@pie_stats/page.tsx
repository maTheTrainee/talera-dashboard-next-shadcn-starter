import { auth } from '@clerk/nextjs/server';
import { getCapabilities } from '@/config/plans';
import { delay } from '@/lib/delay';
import { getTenantMetadata } from '@/lib/pb';
import { PieGraph } from '@/features/overview/components/pie-graph';

export default async function PieStatsPage() {
  await delay(1000);
  // Utfallsfördelning är en utgående-kampanjmetrik — dold för inkommande-only klienter.
  const { orgId } = await auth();
  const tenant = await getTenantMetadata(orgId ?? '');
  const caps = getCapabilities(tenant.subscription_tiers);
  if (!caps.outbound) return null;
  return <PieGraph />;
}
