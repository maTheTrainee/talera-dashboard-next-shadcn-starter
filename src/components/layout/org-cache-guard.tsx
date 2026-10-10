'use client';

import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { getQueryClient } from '@/lib/query-client';

/**
 * Rensar React Query-cachen när den aktiva organisationen växlar —
 * query-nycklarna bär inte org-id, så utan rensning kan gamla orgens
 * listor laddas ur cachen i nya orgen (cross-tenant-cache-kollusion)
 * och leda till 502-maskerade klick på avgående kampanjer.
 */
export function OrgCacheGuard() {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? null;
  const router = useRouter();
  const prevRef = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    // Första render (prevRef undefined) = orgen laddar — rensa inte.
    if (prevRef.current !== undefined && prevRef.current !== orgId) {
      getQueryClient().clear();
      router.refresh();
    }
    prevRef.current = orgId;
  }, [orgId, router]);

  return null;
}
