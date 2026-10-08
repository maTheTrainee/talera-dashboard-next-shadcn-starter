import { Suspense } from 'react';
import { CampaignsTable, CampaignsTableSkeleton } from './campaign-tables';

export default function CampaignListingPage() {
  // The BFF pattern fetches client-side: the Clerk session cookies can't be
  // forwarded on a server-side prefetch without extra plumbing (deferred to
  // the wiring pass).
  return (
    <Suspense fallback={<CampaignsTableSkeleton />}>
      <CampaignsTable />
    </Suspense>
  );
}