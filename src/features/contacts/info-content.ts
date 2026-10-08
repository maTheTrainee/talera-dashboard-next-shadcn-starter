import type { InfobarContent } from '@/components/ui/infobar';

export const contactsInfoContent: InfobarContent = {
  title: 'Kontaktlistor — CRM',
  sections: [
    {
      title: 'Prospekt & ringstatus',
      description:
        'CRM-tabell som spårar varje prospects dialing-status: Ny → I kö → Ringer → I samtal → Avslutat. Telefonnummer normaliseras automatiskt till E.164 (07X ➔ +467X).',
      links: []
    },
    {
      title: 'Samtalshistorik',
      description:
        'Rader med genomförda samtal öppnar transkriptet direkt — och länkar till /dashboard/chat?callId=[ID] för full historik.',
      links: []
    },
    {
      title: 'CSV-mall',
      description:
        'Ladda ner CSV-mallen för att massimportera prospekt. Filen laddas upp via kampanjguidens dropzone-steg.',
      links: []
    }
  ]
};
