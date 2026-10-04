'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'sv' | 'en';

type Translations = Record<string, Record<Locale, string>>;

export const translations: Translations = {
  // Navigation
  'nav.voice-ai': { sv: 'Voice AI', en: 'Voice AI' },
  'nav.settings': { sv: 'Inställningar', en: 'Settings' },
  'nav.overview': { sv: 'Översikt', en: 'Overview' },
  'nav.start-campaign': { sv: 'Starta Kampanj', en: 'Start Campaign' },
  'nav.campaigns': { sv: 'Kampanjer', en: 'Campaigns' },
  'nav.recipients-prospects': { sv: 'Mottagare & Prospekt', en: 'Recipients & Prospects' },
  'nav.realtime-view': { sv: 'Realtidsvy', en: 'Realtime View' },
  'nav.call-transcripts': { sv: 'Samtals-Transkriptioner', en: 'Call Transcripts' },
  'nav.billing-balance': { sv: 'Fakturering & Saldo', en: 'Billing & Balance' },
  'nav.workspaces': { sv: 'Arbetsytor', en: 'Workspaces' },
  'nav.team': { sv: 'Team', en: 'Team' },
  'nav.profile': { sv: 'Profil', en: 'Profile' },
  'nav.notifications': { sv: 'Notifikationer', en: 'Notifications' },

  // Overview
  'overview.title': { sv: 'Hej, Välkommen tillbaka 👋', en: 'Hi, Welcome back 👋' },
  'overview.campaign-type': { sv: 'Kampanjtyp', en: 'Campaign Type' },
  'overview.outbound': { sv: 'Utgående (Bokning)', en: 'Outbound (Appointment Setting)' },
  'overview.inbound': { sv: 'Ingående (Support AI)', en: 'Inbound (Support AI)' },
  'overview.remaining-balance': { sv: 'Kvarvarande Saldo (min)', en: 'Remaining Balance (min)' },
  'overview.called-numbers': { sv: 'Ringda Nummer', en: 'Called Numbers' },
  'overview.answered-calls': { sv: 'Svarade Samtal', en: 'Answered Calls' },
  'overview.booked-meetings': { sv: 'Bokade Möten 🚀', en: 'Booked Meetings 🚀' },
  'overview.active-lines': { sv: 'Aktiva Linjer', en: 'Active Lines' },
  'overview.received-calls': { sv: 'Mottagna Samtal', en: 'Received Calls' },
  'overview.resolved-issues': { sv: 'Lösta Ärenden ✅', en: 'Resolved Issues ✅' },
  'overview.recent-events': { sv: 'Senaste Händelser', en: 'Recent Events' },
  'overview.phone-number': { sv: 'Telefonnummer', en: 'Phone Number' },
  'overview.duration': { sv: 'Längd', en: 'Duration' },
  'overview.outcome': { sv: 'Utfall', en: 'Outcome' },
  'overview.outbound-calls-volume': { sv: 'Samtalsvolym (Utgående)', en: 'Call Volume (Outbound)' },
  'overview.inbound-calls-volume': { sv: 'Samtalsvolym (Ingående)', en: 'Call Volume (Inbound)' },
  'overview.outbound-weekly-summary': {
    sv: 'Veckovis sammanfattning av utgående samtal',
    en: 'Weekly summary of outbound calls'
  },
  'overview.inbound-weekly-summary': {
    sv: 'Veckovis sammanfattning av inkommande samtal',
    en: 'Weekly summary of inbound calls'
  },
  'overview.outbound-daily-distribution': {
    sv: 'Daglig Fördelning (Utgående)',
    en: 'Daily Distribution (Outbound)'
  },
  'overview.inbound-daily-distribution': {
    sv: 'Daglig Fördelning (Ingående)',
    en: 'Daily Distribution (Inbound)'
  },
  'overview.outbound-daily-summary': {
    sv: 'Daglig uppdelning av utgående samtal',
    en: 'Daily breakdown of outbound calls'
  },
  'overview.inbound-daily-summary': {
    sv: 'Daglig uppdelning av inkommande samtal',
    en: 'Daily breakdown of inbound calls'
  },

  // Campaign
  'campaign.title': { sv: 'Starta ny Ringkampanj', en: 'Start New Call Campaign' },
  'campaign.bulk-import': { sv: 'Bulkimport', en: 'Bulk Import' },
  'campaign.campaign-name': { sv: 'Kampanjnamn', en: 'Campaign Name' },
  'campaign.campaign-type': { sv: 'Kampanjtyp', en: 'Campaign Type' },
  'campaign.select-type': { sv: 'Välj typ', en: 'Select type' },
  'campaign.outbound': { sv: 'Utgående - Avtalssättning', en: 'Outbound - Appointment Setting' },
  'campaign.inbound': { sv: 'Ingående - Support AI', en: 'Inbound - Support AI' },
  'campaign.csv-upload': { sv: 'CSV Uppladdning', en: 'CSV Upload' },
  'campaign.drag-drop': {
    sv: 'Dra och släpp CSV-fil här eller klicka för att bläddra',
    en: 'Drag and drop CSV file here or click to browse'
  },
  'campaign.download-template': {
    sv: '📥 Ladda ner exempelfil (.csv)',
    en: '📥 Download template (.csv)'
  },
  'campaign.quick-test': {
    sv: 'Lägg till enstaka nummer (Snabbtest)',
    en: 'Add single number (Quick Test)'
  },
  'campaign.contact-name': { sv: 'Namn', en: 'Name' },
  'campaign.phone-number': { sv: 'Telefonnummer', en: 'Phone Number' },
  'campaign.start-test-call': { sv: 'Starta Testsamtal 🚀', en: 'Start Test Call 🚀' },
  'campaign.launch-campaign': { sv: 'Starta Kampanj', en: 'Launch Campaign' },
  'campaign.success': {
    sv: 'Kampanj skapad och skickad till n8n!',
    en: 'Campaign created and sent to n8n!'
  },
  'campaign.error': { sv: 'Fel vid skapande av kampanj', en: 'Error creating campaign' },

  // Kanban
  'kanban.title': { sv: 'Realtidsvy - Samtalsflöde', en: 'Realtime View - Call Flow' },
  'kanban.pending': { sv: 'I Kö', en: 'Queued' },
  'kanban.ringing': { sv: 'Ringer...', en: 'Ringing...' },
  'kanban.connected': { sv: 'Aktivt Samtal 🎙️', en: 'Active Call 🎙️' },
  'kanban.completed': { sv: 'Slutförda', en: 'Completed' },
  'kanban.no-calls': { sv: 'Inga samtal i denna status', en: 'No calls in this status' },

  // Chat/Transcripts
  'chat.title': { sv: 'Samtals-Transkriptioner', en: 'Call Transcripts' },
  'chat.select-conversation': { sv: 'Välj ett samtal', en: 'Select a call' },
  'chat.ai-agent': { sv: 'AI Agent', en: 'AI Agent' },
  'chat.prospect': { sv: 'Prospekt', en: 'Prospect' },
  'chat.duration': { sv: 'Längd', en: 'Duration' },
  'chat.timestamp': { sv: 'Tidpunkt', en: 'Timestamp' },

  // Leads/Prospects
  'leads.title': { sv: 'Mottagare & Prospekt', en: 'Recipients & Prospects' },
  'leads.phone': { sv: 'Telefonnummer', en: 'Phone Number' },
  'leads.name': { sv: 'Kundnamn', en: 'Customer Name' },
  'leads.status': { sv: 'Status', en: 'Status' },
  'leads.duration': { sv: 'Längd (sek)', en: 'Duration (sec)' },
  'leads.ai-summary': { sv: 'AI Sammanfattning', en: 'AI Summary' },
  'leads.search': { sv: 'Sök prospekt...', en: 'Search prospects...' },

  // Common
  'common.save': { sv: 'Spara', en: 'Save' },
  'common.cancel': { sv: 'Avbryt', en: 'Cancel' },
  'common.loading': { sv: 'Laddar...', en: 'Loading...' },
  'common.error': { sv: 'Fel', en: 'Error' },
  'common.success': { sv: 'Lyckades', en: 'Success' },
  'common.minutes': { sv: 'min', en: 'min' },
  'common.seconds': { sv: 'sek', en: 'sec' },

  // Admin
  'admin.title': { sv: 'Admin', en: 'Admin' },
  'admin.description': {
    sv: 'Administrera Voice AI-konfiguration',
    en: 'Manage Voice AI configuration'
  },
  'admin.tabs.overview': { sv: 'Översikt', en: 'Overview' },
  'admin.tabs.ultravox': { sv: 'Ultravox', en: 'Ultravox' },
  'admin.tabs.n8n': { sv: 'n8n', en: 'n8n' },
  'admin.tabs.limits': { sv: 'Gränser', en: 'Limits' },
  'admin.tabs.features': { sv: 'Funktioner', en: 'Features' },

  'admin.overview.campaignMode': { sv: 'Kampanjläge', en: 'Campaign Mode' },
  'admin.overview.ultravoxStatus': { sv: 'Ultravox-status', en: 'Ultravox Status' },
  'admin.overview.n8nStatus': { sv: 'n8n-status', en: 'n8n Status' },

  'admin.ultravox.enabled': { sv: 'Aktiverad', en: 'Enabled' },
  'admin.ultravox.apiKey': { sv: 'API-nyckel', en: 'API Key' },
  'admin.ultravox.baseUrl': { sv: 'Bas-URL', en: 'Base URL' },
  'admin.ultravox.defaultVoiceId': { sv: 'Standard-röst', en: 'Default Voice' },
  'admin.ultravox.defaultModel': { sv: 'Standard-modell', en: 'Default Model' },
  'admin.ultravox.webhookSecret': { sv: 'Webhook-hemlighet', en: 'Webhook Secret' },

  'admin.n8n.enabled': { sv: 'Aktiverad', en: 'Enabled' },
  'admin.n8n.apiKey': { sv: 'API-nyckel', en: 'API Key' },
  'admin.n8n.baseUrl': { sv: 'Bas-URL', en: 'Base URL' },
  'admin.n8n.webhookUrl': { sv: 'Webhook-URL', en: 'Webhook URL' },
  'admin.n8n.campaignTriggerWorkflowId': {
    sv: 'Kampanj-utlösare Workflow ID',
    en: 'Campaign Trigger Workflow ID'
  },
  'admin.n8n.quickDialWorkflowId': { sv: 'Snabbtest Workflow ID', en: 'Quick Dial Workflow ID' },
  'admin.n8n.statusCallbackWorkflowId': {
    sv: 'Status-callback Workflow ID',
    en: 'Status Callback Workflow ID'
  },

  'admin.limits.maxConcurrentCalls': { sv: 'Max samtidiga samtal', en: 'Max Concurrent Calls' },
  'admin.limits.maxDailyMinutes': { sv: 'Max minuter per dag', en: 'Max Daily Minutes' },
  'admin.limits.maxMonthlyMinutes': { sv: 'Max minuter per månad', en: 'Max Monthly Minutes' },
  'admin.limits.outboundMinuteCost': {
    sv: 'Kostnad/minut utgående (SEK)',
    en: 'Outbound Cost/min (SEK)'
  },
  'admin.limits.inboundMinuteCost': {
    sv: 'Kostnad/minut inkommande (SEK)',
    en: 'Inbound Cost/min (SEK)'
  },

  'admin.features.liveTranscription': { sv: 'Live-transkription', en: 'Live Transcription' },
  'admin.features.liveTranscriptionDesc': {
    sv: 'Visa transkription i realtid under samtal',
    en: 'Show transcription in real-time during calls'
  },
  'admin.features.aiSummary': { sv: 'AI-sammanfattning', en: 'AI Summary' },
  'admin.features.aiSummaryDesc': {
    sv: 'Generera AI-sammanfattning efter samtal',
    en: 'Generate AI summary after calls'
  },
  'admin.features.callRecording': { sv: 'Samtalsinspelning', en: 'Call Recording' },
  'admin.features.callRecordingDesc': {
    sv: 'Spela in samtal för kvalitetssäkring',
    en: 'Record calls for quality assurance'
  },
  'admin.features.voicemailDetection': { sv: 'Röstbrevlådedetektion', en: 'Voicemail Detection' },
  'admin.features.voicemailDetectionDesc': {
    sv: 'Upptäck och hantera röstbrevlådor',
    en: 'Detect and handle voicemails'
  },
  'admin.features.answeringMachineDetection': {
    sv: 'Svarmaskindetektion',
    en: 'Answering Machine Detection'
  },
  'admin.features.answeringMachineDetectionDesc': {
    sv: 'Upptäck svarmaskiner automatiskt',
    en: 'Automatically detect answering machines'
  },

  // Schedule tab
  'admin.tabs.schedule': { sv: 'Tidsschema', en: 'Schedule' },
  'admin.schedule.enabled': { sv: 'Aktiverat', en: 'Enabled' },
  'admin.schedule.timezone': { sv: 'Tidszon', en: 'Timezone' },
  'admin.schedule.allowedDays': { sv: 'Tillåtna dagar', en: 'Allowed Days' },
  'admin.schedule.startHour': { sv: 'Starttid (timme)', en: 'Start Hour' },
  'admin.schedule.endHour': { sv: 'Sluttid (timme)', en: 'End Hour' },
  'admin.schedule.excludedDates': { sv: 'Undantagsdatum', en: 'Excluded Dates' },
  'admin.schedule.excludedDatesDesc': {
    sv: 'Komma-separerade datum (YYYY-MM-DD), t.ex. helgdagar',
    en: 'Comma-separated dates (YYYY-MM-DD), e.g. holidays'
  }
};

export function t(key: string, locale: Locale = 'sv'): string {
  return translations[key]?.[locale] ?? key;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  defaultLocale = 'sv'
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored && (stored === 'sv' || stored === 'en')) {
      setLocale(stored);
    }
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  return (
    <I18nContext.Provider
      value={{ locale, setLocale: handleSetLocale, t: (key) => t(key, locale) }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
