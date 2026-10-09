import type { InfobarContent } from '@/components/ui/infobar';

export const contactsInfoContent: InfobarContent = {
  title: 'Kontakter',
  sections: [
    {
      title: 'Prospekt & ringstatus',
      description:
        'Varje prospekt följer ringstatusen: Ny → I kö → Ringer → I samtal → Avslutat. Telefonnummer formateras automatiskt.',
      links: []
    },
    {
      title: 'Samtalshistorik',
      description:
        'Prospekt med genomförda samtal öppnar transkriptet direkt — och länkar till full historik.',
      links: []
    },
    {
      title: 'CSV-mall',
      description:
        'Ladda ner CSV-mallen för att massimportera prospekt. Filen laddas upp via kampanjguiden.',
      links: []
    }
  ]
};
