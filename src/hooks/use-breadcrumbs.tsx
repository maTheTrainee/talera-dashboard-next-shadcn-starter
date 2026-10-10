'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

/**
 * Svenska sökvägsrubriker — kända segment översätts, okända dynamiska id:n
 * mappas via kontext (kampanj-id → Kampanjdetaljer) och okända Clerk-profil-
 * undervägar kapitaliseras som fallback.
 */
const SEGMENT_TITLES: Record<string, string> = {
  dashboard: 'Hem',
  overview: 'Översikt',
  campaigns: 'Ringkampanjer',
  contacts: 'Kontakter',
  kanban: 'Realtidsvy',
  chat: 'Samtalshistorik',
  assist: 'Ring AI-Assistent',
  notifications: 'Notiser',
  profile: 'Profil',
  workspaces: 'Arbetsytor',
  team: 'Team',
  'ai-chat': 'AI Chat',
  // Clerk-profilens undervägar (engelska slugs — översatta där kända)
  account: 'Konto',
  security: 'Säkerhet',
  sessions: 'Sessioner',
  emails: 'E-post',
  'connected-accounts': 'Kopplade konton'
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let previousArea = '';

    segments.forEach((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const isKnown = segment in SEGMENT_TITLES;

      // Dynamiskt id under Ringkampanjer = kampanjdetaljer-sidan.
      if (!isKnown && previousArea === 'campaigns') {
        items.push({ title: 'Kampanjdetaljer', link: path });
        previousArea = '';
        return;
      }
      // Okända id:n/undervägar (t.ex. Clerk-interna) hoppas över.
      if (!isKnown) return;

      previousArea = segment;
      items.push({ title: SEGMENT_TITLES[segment], link: path });
    });

    return items;
  }, [pathname]);

  return breadcrumbs;
}
