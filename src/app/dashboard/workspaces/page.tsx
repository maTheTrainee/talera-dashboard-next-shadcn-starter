'use client';

import PageContainer from '@/components/layout/page-container';
import { OrganizationList } from '@clerk/nextjs';
import { workspacesInfoContent } from '@/config/infoconfig';

export default function WorkspacesPage() {
  return (
    <PageContainer
      pageTitle='Arbetsytor'
      pageDescription='Hantera dina arbetsytor och växla mellan dem'
      infoContent={workspacesInfoContent}
    >
      {/* Org-skapande är manuellt och medvetet: kundföretaget = EN Clerk-org,
          namngiven efter företaget. Databas-rummet (tenant-kontot + all kunddata
          stämplad clerk_org_id) provisioneras automatiskt av den lazy
          tenant-provisioningen vid kundens första autentiserade anrop.
          Auto-skapande här skapade dubbletter ("Jockes organisation" ×25) och
          splitskåde kunddatan mellan orgarna — borttaget. */}
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
