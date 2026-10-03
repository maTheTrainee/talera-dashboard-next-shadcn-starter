import type { CallTranscript, TranscriptMessage } from './types';

export const initialTranscripts: CallTranscript[] = [
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
      },
      {
        id: '3',
        role: 'agent',
        text: 'Fantastiskt! Vår AI-agent hanterar inkommande samtal 24/7, kan boka möten direkt i er kalender och integreras med er CRM. Vill du att jag bokar en kort demo så ni ser hur det fungerar i praktiken?',
        timestamp: '00:45'
      },
      {
        id: '4',
        role: 'prospect',
        text: 'Ja, absolut. Torsdag förmiddag passar bra.',
        timestamp: '01:12'
      },
      {
        id: '5',
        role: 'agent',
        text: 'Perfekt! Jag bokar torsdag kl 10:00. Du får en bekräftelse på mail med möteslänk. Något annat du undrar över innan vi avslutar?',
        timestamp: '01:35'
      },
      {
        id: '6',
        role: 'prospect',
        text: 'Nej, det var bra. Tack för samtalet!',
        timestamp: '02:01'
      },
      {
        id: '7',
        role: 'agent',
        text: 'Varsågod! Vi ses torsdag då. Ha en trevlig dag!',
        timestamp: '02:15'
      }
    ],
    organizationId: 'org-1'
  },
  {
    id: 'call-2',
    phoneNumber: '+46 73 987 65 43',
    customerName: 'Anna Johansson',
    campaignType: 'outbound',
    status: 'completed',
    duration: '02:18',
    outcome: 'answered',
    startedAt: '2026-10-03T09:45:00Z',
    aiSummary: 'Kunden svarade men var upptagen. Be om att ringa tillbaka nästa vecka.',
    messages: [
      {
        id: '1',
        role: 'agent',
        text: 'Hej Anna! Här är Lisa från Talera. Vi hjälper företag automatisera kundsamtal med AI. Är det en bra stund att prata?',
        timestamp: '00:08'
      },
      {
        id: '2',
        role: 'prospect',
        text: 'Är lite stressad just nu, kan du ringa tillbaka nästa vecka?',
        timestamp: '00:22'
      },
      {
        id: '3',
        role: 'agent',
        text: 'Absolut, jag förstår. Jag sätter en påminnelse och ringer tillbaka måndag nästa vecka. Har du en föredragen tid?',
        timestamp: '00:45'
      },
      { id: '4', role: 'prospect', text: 'Måndag efter lunch passar.', timestamp: '01:05' },
      {
        id: '5',
        role: 'agent',
        text: 'Noterat! Måndag efter lunch. Tack för din tid, Anna.',
        timestamp: '01:20'
      }
    ],
    organizationId: 'org-1'
  },
  {
    id: 'call-3',
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
      },
      { id: '3', role: 'prospect', text: 'Kundnummer 12345.', timestamp: '00:18' },
      {
        id: '4',
        role: 'agent',
        text: 'Tack, jag ser fakturan nu. Det ser ut som om en engångsavgift för installation har lagts till. Vill du att jag skickar en förklaring på mail samt en kopia av fakturan?',
        timestamp: '00:35'
      },
      { id: '5', role: 'prospect', text: 'Ja tack, det hade varit bra.', timestamp: '00:48' },
      {
        id: '6',
        role: 'agent',
        text: 'Klart! Fakturan och förklaring är skickad till din registrerade e-post. Det går att betala via Swish, bankgiro eller kort. Behöver du hjälp med något mer?',
        timestamp: '01:15'
      },
      { id: '7', role: 'prospect', text: 'Nej, det var allt. Tack så mycket!', timestamp: '01:28' },
      { id: '8', role: 'agent', text: 'Varsågod! Ha en fortsatt trevlig dag.', timestamp: '01:35' }
    ],
    organizationId: 'org-1'
  },
  {
    id: 'call-4',
    phoneNumber: '+46 31 987 65 43',
    customerName: 'Support Center',
    campaignType: 'inbound',
    status: 'completed',
    duration: '03:22',
    outcome: 'resolved',
    startedAt: '2026-10-03T10:55:00Z',
    aiSummary:
      'Teknisk fråga om API-integration. AI vägledde genom autentiseringsflöde och skickade dokumentationslänk.',
    messages: [
      {
        id: '1',
        role: 'prospect',
        text: 'Hej, jag försöker integrera er API men får 401-fel vid autentisering.',
        timestamp: '00:05'
      },
      {
        id: '2',
        role: 'agent',
        text: 'Hej! 401 betyder oftast att API-nyckeln saknas eller är ogiltig. Har du lagt till "Authorization: ******" i headern?',
        timestamp: '00:15'
      },
      {
        id: '3',
        role: 'prospect',
        text: 'Ah, jag hade glömt Bearer-prefixet. Låt mig testa...',
        timestamp: '00:32'
      },
      {
        id: '4',
        role: 'prospect',
        text: 'Nu fungerar det! Tack för snabba hjälpen.',
        timestamp: '01:05'
      },
      {
        id: '5',
        role: 'agent',
        text: 'Skönt att höra! Här är länken till vår fullständiga API-dokumentation för framtida referens. Lycka till med integrationen!',
        timestamp: '01:18'
      }
    ],
    organizationId: 'org-1'
  },
  {
    id: 'call-5',
    phoneNumber: '+46 76 555 12 34',
    customerName: 'Lars Nilsson',
    campaignType: 'outbound',
    status: 'completed',
    duration: '00:45',
    outcome: 'voicemail',
    startedAt: '2026-10-03T09:30:00Z',
    aiSummary: 'Ingen svar, röstbrevlåda. AI lämnade meddelande med callback-nummer.',
    messages: [
      {
        id: '1',
        role: 'agent',
        text: 'Hej Lars, här är Maria från Talera Voice AI. Jag ville bara höra om ni har intresse av att automatisera era kundsamtal. Ring gärna tillbaka på 08-123 45 67 eller besök vår hemsida. Ha en bra dag!',
        timestamp: '00:15'
      }
    ],
    organizationId: 'org-1'
  },
  // Live calls (ringing/connected) - these would have joinUrl for Ultravox WebSocket
  {
    id: 'call-6',
    phoneNumber: '+46 70 222 33 44',
    customerName: 'Maria Svensson',
    campaignType: 'outbound',
    status: 'ringing',
    startedAt: '2026-10-03T14:15:00Z',
    joinUrl: 'wss://api.ultravox.ai/join/abc123',
    ultravoxCallId: 'abc123',
    messages: [
      {
        id: '1',
        role: 'agent',
        text: 'Hej Maria! Det här är Anna från Talera Voice AI...',
        timestamp: '14:15',
        isStreaming: true
      }
    ],
    isLive: true,
    organizationId: 'org-1'
  },
  {
    id: 'call-7',
    phoneNumber: '+46 8 555 12 34',
    customerName: 'TechCorp AB',
    campaignType: 'inbound',
    status: 'connected',
    startedAt: '2026-10-03T14:10:00Z',
    joinUrl: 'wss://api.ultravox.ai/join/def456',
    ultravoxCallId: 'def456',
    messages: [
      { id: '1', role: 'prospect', text: 'Hej, jag ringer om ert API...', timestamp: '14:10' },
      {
        id: '2',
        role: 'agent',
        text: 'Hej! Välkommen till Talera Support. Hur kan jag hjälpa?',
        timestamp: '14:11'
      }
    ],
    isLive: true,
    currentState: 'speaking',
    organizationId: 'org-1'
  }
];
