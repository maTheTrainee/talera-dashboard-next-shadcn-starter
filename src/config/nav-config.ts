import { NavGroup } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 *
 * Examples:
 *
 * 1. Require organization:
 *    access: { requireOrg: true }
 *
 * 2. Require specific permission:
 *    access: { requireOrg: true, permission: 'org:teams:manage' }
 *
 * 3. Require specific plan:
 *    access: { plan: 'pro' }
 *
 * 4. Require specific feature:
 *    access: { feature: 'premium_access' }
 *
 * 5. Require specific role:
 *    access: { role: 'admin' }
 *
 * 6. Multiple conditions (all must be true):
 *    access: { requireOrg: true, permission: 'org:teams:manage', plan: 'pro' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 *
 * Navigation labels use i18n translation keys - actual translations are in src/lib/i18n.tsx
 */
export const navGroups: NavGroup[] = [
  {
    label: 'nav.voice-ai',
    items: [
      {
        title: 'nav.overview',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['o', 'o'],
        items: []
      },
      {
        title: 'nav.campaigns',
        url: '/dashboard/campaigns',
        icon: 'list',
        shortcut: ['c', 'c'],
        isActive: false,
        items: []
      },
      {
        title: 'nav.recipients-prospects',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['m', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'nav.realtime-view',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['r', 'v'],
        isActive: false,
        items: []
      },
      {
        title: 'nav.call-transcripts',
        url: '/dashboard/chat',
        icon: 'chat',
        shortcut: ['s', 't'],
        isActive: false,
        items: []
      },
      {
        title: 'nav.billing-balance',
        url: '/dashboard/billing',
        icon: 'billing',
        shortcut: ['f', 's'],
        isActive: false,
        items: [],
        access: { requireOrg: true }
      }
    ]
  },
  {
    label: 'nav.settings',
    items: [
      {
        title: 'nav.workspaces',
        url: '/dashboard/workspaces',
        icon: 'workspace',
        isActive: false,
        items: []
      },
      {
        title: 'nav.team',
        url: '/dashboard/workspaces/team',
        icon: 'teams',
        isActive: false,
        items: [],
        access: { requireOrg: true }
      },
      {
        title: 'nav.profile',
        url: '/dashboard/profile',
        icon: 'profile',
        shortcut: ['p', 'p'],
        items: []
      },
      {
        title: 'nav.notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        shortcut: ['n', 'n'],
        items: []
      }
    ]
  }
];
