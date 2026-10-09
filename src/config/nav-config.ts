import { NavGroup } from '@/types';

/**
 * Talera navigation — the multi-tenant tree.
 *
 * Access = medlemmens roll ∩ organisationens paket (src/lib/access.ts):
 * - `areas` kräver ett operativt område (utgaende / inkommande / ai_assistent)
 * - admin ser allt orgen äger · paketen är taket för ALLA roller
 * - paket utan utgående ser aldrig Ringkampanjer; utan AI Assistent syns
 *   assistenten inte ens för admin (sidan visar uppgraderingsskärm)
 * - `hidden` håller AI Chat kompilerad men osynlig (sidebar + ⌘K)
 *
 * Filtreringen sker SERVER-side (layouten skickar de filtrerade grupperna till
 * sidebar + kbar) — alltid färsk från PocketBase, ingen metadata-drift.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Översikt',
    items: [
      {
        title: 'Översikt',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        items: [],
        access: { areas: ['utgaende', 'inkommande'] }
      },
      {
        title: 'Ringkampanjer',
        url: '/dashboard/campaigns',
        icon: 'send',
        isActive: false,
        items: [],
        access: { areas: ['utgaende'] }
      },
      {
        title: 'Kontakter',
        url: '/dashboard/contacts',
        icon: 'teams',
        isActive: false,
        items: [],
        access: { areas: ['utgaende', 'inkommande'] }
      },
      {
        title: 'Realtidsvy',
        url: '/dashboard/kanban',
        icon: 'kanban',
        isActive: false,
        items: [],
        access: { areas: ['utgaende', 'inkommande'] }
      },
      {
        title: 'Samtalshistorik',
        url: '/dashboard/chat',
        icon: 'chat',
        isActive: false,
        items: [],
        access: { areas: ['utgaende', 'inkommande'] }
      },
      {
        title: 'Ring AI-Assistent',
        url: '/dashboard/assist',
        icon: 'phone',
        isActive: false,
        items: [],
        access: { areas: ['ai_assistent'] }
      },
      {
        title: 'AI Chat',
        url: '/dashboard/ai-chat',
        icon: 'sparkles',
        isActive: false,
        hidden: true,
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Workspaces',
        url: '/dashboard/workspaces',
        icon: 'workspace',
        isActive: false,
        items: []
      },
      {
        title: 'Teams',
        url: '/dashboard/workspaces/team',
        icon: 'teams',
        isActive: false,
        items: [],
        access: { requireOrg: true }
      },
      {
        title: 'Account',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          },
          {
            title: 'Notifications',
            url: '/dashboard/notifications',
            icon: 'notification',
            shortcut: ['n', 'n']
          },
          {
            title: 'Login',
            shortcut: ['l', 'l'],
            url: '/',
            icon: 'login'
          }
        ]
      }
    ]
  }
];
