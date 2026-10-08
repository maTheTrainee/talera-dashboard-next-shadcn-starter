import { NavGroup } from '@/types';

/**
 * Talera navigation — the multi-tenant tree.
 *
 * RBAC: items 1–5 carry `access: { role: 'org:admin' }` — non-admin operator
 * accounts see ONLY "Ring AI-Assistent" (pinned as their standalone workspace).
 * The `hidden` property keeps AI Chat fully compiled in the build but removes
 * it from the sidebar and Cmd+K bar (reserved for a future admin status bot).
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
        access: { role: 'org:admin' }
      },
      {
        title: 'Ringkampanjer',
        url: '/dashboard/campaigns',
        icon: 'send',
        isActive: false,
        items: [],
        access: { role: 'org:admin' }
      },
      {
        title: 'Kontaktlistor',
        url: '/dashboard/contacts',
        icon: 'teams',
        isActive: false,
        items: [],
        access: { role: 'org:admin' }
      },
      {
        title: 'Realtidsvy',
        url: '/dashboard/kanban',
        icon: 'kanban',
        isActive: false,
        items: [],
        access: { role: 'org:admin' }
      },
      {
        title: 'Samtalshistorik',
        url: '/dashboard/chat',
        icon: 'chat',
        isActive: false,
        items: [],
        access: { role: 'org:admin' }
      },
      {
        title: 'Ring AI-Assistent',
        url: '/dashboard/assist',
        icon: 'phone',
        isActive: false,
        items: []
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
