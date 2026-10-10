import { NextRequest, NextResponse } from 'next/server';
import { requireArea, requireAuthContext } from '@/lib/api-auth';
import { ensurePbOrgAuth } from '@/lib/pb';

// ============================================================
// Kontakter → kampanj ("Lägg i kampanj"): länkar markerade kontakter
// (utan befintlig kampanj) till en org-egen, icke-avslutad kampanj.
// En kontakt ligger i max en kampanj — redan-kopplade kontakter vägras.
// ============================================================

interface LinkPayload {
  contactIds: string[];
  campaignId: string;
}

export async function POST(request: NextRequest) {
  const guard = await requireAuthContext();
  if (!guard.ok) return guard.response;
  const { orgId } = guard.ctx;

  // Nivå 2 — utgående-området krävs (roll ∩ paket).
  if (!(await requireArea(guard.ctx, 'utgaende'))) {
    return NextResponse.json(
      { error: 'Du saknar behörighet för den här funktionen.' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as LinkPayload;
    const contactIds = Array.isArray(body.contactIds) ? body.contactIds.filter(Boolean) : [];
    if (contactIds.length === 0 || !body.campaignId) {
      return NextResponse.json({ error: 'Välj minst en kontakt och en kampanj.' }, { status: 400 });
    }

    const pb = await ensurePbOrgAuth(orgId);

    let campaign: { clerk_org_id: string; status: string };
    try {
      campaign = (await pb.collection('campaigns').getOne(body.campaignId)) as unknown as {
        clerk_org_id: string;
        status: string;
      };
    } catch {
      // 404 — cross-tenant id probes must not reveal that the campaign exists.
      return NextResponse.json({ error: 'Kampanjen hittades inte.' }, { status: 404 });
    }
    if (campaign.clerk_org_id !== orgId) {
      return NextResponse.json({ error: 'Kampanjen hittades inte.' }, { status: 404 });
    }
    if (campaign.status === 'avslutad') {
      return NextResponse.json(
        { error: 'Avslutade kampanjer kan inte ta emot nya prospekter.' },
        { status: 400 }
      );
    }

    let linked = 0;
    let skipped = 0;
    for (const contactId of contactIds) {
      try {
        const contact = (await pb.collection('contacts').getOne(contactId)) as unknown as {
          campaign: string | null;
        };
        // En kontakt ligger i max en kampanj — redan-kopplade hoppas över.
        if (contact.campaign) {
          skipped++;
          continue;
        }
        await pb.collection('contacts').update(contactId, {
          campaign: body.campaignId,
          status: 'i_ko'
        });
        linked++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ linked, skipped });
  } catch {
    return NextResponse.json(
      { error: 'Kontakterna kunde inte läggas i kampanjen.' },
      { status: 502 }
    );
  }
}
