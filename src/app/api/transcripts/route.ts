// ============================================================
// Route Handler — Transcripts (list + create)
// ============================================================
// SECURE: Uses Clerk auth() to enforce organization isolation
// ============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import type { CallTranscript, TranscriptMessage } from '@/features/chat/utils/types';

// Mock storage for transcripts (replace with database in production)
const mockTranscripts: Map<string, CallTranscript> = new Map();

// Initialize with some mock data
function initMockTranscripts() {
  if (mockTranscripts.size === 0) {
    const mockData: CallTranscript[] = [
      {
        id: 'call-1',
        phoneNumber: '+46 70 123 45 67',
        customerName: 'Erik Andersson',
        campaignType: 'outbound',
        status: 'completed',
        duration: '04:32',
        outcome: 'booked',
        startedAt: '2026-10-03T10:15:00Z',
        aiSummary:
          'Kunden var intresserad av vår premiumlösning. Bokat möte för torsdag 10:00 för demo.',
        messages: [
          {
            id: '1',
            role: 'agent',
            text: 'Hej Erik! Det här är Anna från Talera Voice AI. Jag ringer för att berätta om vår nya AI-drivna kundtjänstlösning som kan minska svarstider med 80%. Har du ett par minuter?',
            timestamp: '00:05'
          },
          {
            id: '2',
            role: 'prospect',
            text: 'Hej Anna. Ja, det låter intressant. Vi har faktiskt letat efter en bättre lösning för vår support.',
            timestamp: '00:18'
          }
        ],
        organizationId: 'org-1'
      },
      {
        id: 'call-2',
        phoneNumber: '+46 8 123 45 67',
        customerName: 'Kundtjänst AB',
        campaignType: 'inbound',
        status: 'completed',
        duration: '06:45',
        outcome: 'resolved',
        startedAt: '2026-10-03T11:20:00Z',
        aiSummary:
          'Kund hade frågor om fakturering. AI löste genom att skicka kopia av faktura via mail och förklarade betalningsvillkor.',
        messages: [
          {
            id: '1',
            role: 'prospect',
            text: 'Hej, jag ringer angående min senaste faktura. Jag tror det är ett fel på beloppet.',
            timestamp: '00:03'
          },
          {
            id: '2',
            role: 'agent',
            text: 'Hej! Jag hjälper gärna till. Kan du ge mig ditt kundnummer så kollar jag upp fakturan?',
            timestamp: '00:12'
          }
        ],
        organizationId: 'org-1'
      }
    ];

    mockData.forEach((t) => mockTranscripts.set(t.id, t));
  }
}

initMockTranscripts();

export async function GET(request: NextRequest) {
  // 🔒 SECURE: Get organization from Clerk auth
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation' },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('search') ?? undefined;
  const campaignType = searchParams.get('campaignType') ?? undefined;
  const status = searchParams.get('status') ?? undefined;

  // 🔒 SECURE: Filter by orgId
  let transcripts = Array.from(mockTranscripts.values()).filter((t) => t.organizationId === orgId);

  if (search) {
    const s = search.toLowerCase();
    transcripts = transcripts.filter(
      (t) => t.customerName.toLowerCase().includes(s) || t.phoneNumber.includes(s)
    );
  }

  if (campaignType) {
    transcripts = transcripts.filter((t) => t.campaignType === campaignType);
  }

  if (status) {
    transcripts = transcripts.filter((t) => t.status === status);
  }

  // Sort by startedAt desc
  transcripts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const total = transcripts.length;
  const offset = (page - 1) * limit;
  const paginated = transcripts.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    message: 'Transkriptioner hämtade',
    total_transcripts: total,
    offset,
    limit,
    transcripts: paginated
  });
}

export async function POST(request: NextRequest) {
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json(
      { success: false, message: 'Ingen aktiv organisation' },
      { status: 401 }
    );
  }

  const body = await request.json();

  // Create new transcript
  const transcript: CallTranscript = {
    ...body,
    id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organizationId: orgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockTranscripts.set(transcript.id, transcript);

  return NextResponse.json(
    {
      success: true,
      time: new Date().toISOString(),
      message: 'Transkription skapad',
      transcript
    },
    { status: 201 }
  );
}
