import type { InfobarContent } from '@/components/ui/infobar';

export const usersInfoContent: InfobarContent = {
  title: 'Mottagare & Prospekt — Ledger',
  sections: [
    {
      title: 'Översikt',
      description:
        'Denna sida visar en ledger över alla mottagare och prospekt från dina Voice AI-kampanjer. Du kan se samtalsstatus, varaktighet, AI-sammanfattningar och filtrera efter kampanjtyp (utgående/ingående).'
    },
    {
      title: 'Tabellfunktioner',
      description:
        'Tabellen stöder sortering, filtrering, paginering och sökning. Alla filter sparas i URL:en via nuqs så du kan dela länkar med kollegor. Använd kolumnfilter för att hitta specifika prospekt baserat på status, kampanjtyp eller sök på namn/telefonnummer.'
    },
    {
      title: 'Statusvärden',
      description:
        '• Ny — Nytt nummer i kö\n• Kontaktad — Samtal genomfört men ej kvalificerad\n• Kvalificerad — Prospekt visat intresse\n• Bokat 🚀 — Möte bokat\n• Avslutad — Ärende löst\n• Förlorad — Ej intresserad'
    },
    {
      title: 'AI Sammanfattning',
      description:
        'Varje rad visar en AI-genererad sammanfattning av samtalet. Detta hjälper dig snabbt förstå vad som diskuterades utan att behöva läsa hela transkriptionen.'
    }
  ]
};
