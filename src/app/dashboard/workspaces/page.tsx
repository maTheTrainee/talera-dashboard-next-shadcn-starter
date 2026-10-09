'use client';

import PageContainer from '@/components/layout/page-container';
import { OrganizationList, useOrganizationList, useUser } from '@clerk/nextjs';
import { workspacesInfoContent } from '@/config/infoconfig';
import * as React from 'react';

/**
 * OrgBootstrap — the forced-org funnel (Nivå 1): a signed-in user with NO org
 * membership gets one created and activated automatically (zero clicks).
 * The PB tenant materializes on the first authenticated request after this.
 */
function OrgBootstrap() {
  const { isLoaded, userMemberships, createOrganization, setActive } =
    useOrganizationList();
  const { user, isLoaded: userLoaded } = useUser();
  const [creating, setCreating] = React.useState(false);
  const attemptedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isLoaded || !userLoaded || creating || attemptedRef.current) return;
    const membershipCount = userMemberships?.data?.length ?? 0;
    if (membershipCount > 0) return; // already has orgs — nothing to bootstrap

    attemptedRef.current = true;
    setCreating(true);
    const name = user?.firstName
      ? `${user.firstName}s organisation`
      : 'Min organisation';
    createOrganization({ name })
      .then((org) => setActive({ organization: org.id ?? org }))
      .catch(() => {})
      .finally(() => setCreating(false));
  }, [isLoaded, userLoaded, user, userMemberships, creating, createOrganization, setActive]);

  if (!creating) return null;
  return <p className='text-muted-foreground text-sm'>Skapar din organisation…</p>;
}

export default function WorkspacesPage() {
  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Hantera dina arbetsytor och växla mellan dem'
      infoContent={workspacesInfoContent}
    >
      <OrgBootstrap />
      <OrganizationList
        appearance={{
          elements: {
            organizationListBox: 'space-y-2',
            organizationPreview: 'rounded-lg border p-4 hover:bg-accent',
            organizationPreviewMainIdentifier: 'text-lg font-semibold',
            organizationPreviewSecondaryIdentifier: 'text-sm text-muted-foreground'
          }
        }}
        afterSelectOrganizationUrl='/dashboard/workspaces/team'
        afterCreateOrganizationUrl='/dashboard/workspaces/team'
      />
    </PageContainer>
  );
}
