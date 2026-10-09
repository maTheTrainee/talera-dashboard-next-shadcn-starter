import { auth } from '@clerk/nextjs/server';
import { getCapabilities } from '@/config/plans';
import { roleGrants } from '@/lib/access';
import { getTenantMetadata } from '@/lib/pb';
import PageContainer from '@/components/layout/page-container';
import { AssistWorkspace } from '@/features/assist/components/assist-workspace';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export const metadata = {
  title: 'Dashboard: Ring AI-Assistent'
};

export default async function AssistPage() {
  // Server-side gate (Nivå 1 + 2): the package (caps.internal) AND the role
  // grant (ai_assistent area) must both pass — the nav hides the item, this
  // page covers hand-typed URLs with a clean upgrade screen.
  const { orgId, orgRole } = await auth();
  const tenant = orgId ? await getTenantMetadata(orgId) : null;
  const caps = tenant ? getCapabilities(tenant.subscription_tiers) : null;
  const grants = roleGrants(orgRole);
  const allowed = !!caps?.internal && grants.includes('ai_assistent');

  return (
    <PageContainer
      pageTitle='Ring AI-Assistent'
      pageDescription='Din AI-assistent är redo — tryck för att ringa. Samtalet startar direkt i webbläsaren via en säker röstanslutning.'
    >
      {allowed ? (
        <AssistWorkspace />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ingår inte i ert paket</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-sm'>
              AI Assistenten ingår inte i era nuvarande paket — kontakta Talera
              för att lägga till den, eller be er admin om rätt behörighet.
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}