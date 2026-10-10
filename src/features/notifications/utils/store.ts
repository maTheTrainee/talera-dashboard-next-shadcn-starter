import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
import type { NotificationStatus, NotificationAction } from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: '🎉 Nytt möte bokat!',
    body: 'AI-agenten bokade ett möte med Anna Andersson (Acme AB) — torsdag 14:00.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actions: [
      {
        id: 'view-contact',
        label: 'Visa kontakt',
        type: 'redirect',
        style: 'primary',
        route: '/dashboard/contacts?name=Anna%20Andersson'
      }
    ]
  },
  {
    id: '2',
    title: '✅ Kvalificerad prospekt',
    body: 'Erik Svensson (Nordica AB) kvalificerades som prospekt efter samtalet.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actions: [
      {
        id: 'view-contact',
        label: 'Visa kontakt',
        type: 'redirect',
        style: 'primary',
        route: '/dashboard/contacts?name=Erik%20Svensson'
      }
    ]
  },
  {
    id: '3',
    title: '📅 Uppföljning bokad',
    body: 'Uppföljning med Maria Larsson bokad till kl 15:30.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actions: [
      {
        id: 'view-contact',
        label: 'Visa kontakt',
        type: 'redirect',
        style: 'primary',
        route: '/dashboard/contacts?name=Maria%20Larsson'
      }
    ]
  },
  {
    id: '4',
    title: '🚀 Kampanj startad',
    body: 'Kampanjen "Q1 Försäljning" har startat och ringer enligt schemat.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    // Mock-seed — riktiga n8n-notiser ska bära kampanjens id och länka
    // /dashboard/campaigns/{id} (Kampanjdetaljer) direkt.
    actions: [
      {
        id: 'view-campaign',
        label: 'Visa kampanjen',
        type: 'redirect',
        style: 'primary',
        route: '/dashboard/campaigns'
      }
    ]
  },
  {
    id: '5',
    title: '⚠️ Minutpoolen nästan slut',
    body: 'Överförbrukning aktiveras automatiskt (5,90 kr/min exkl. moms) när poolen tar slut.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    actions: [
      {
        id: 'view-overview',
        label: 'Visa Översikt',
        type: 'redirect',
        style: 'primary',
        route: '/dashboard/overview'
      }
    ]
  }
];

export const useNotificationStore = create<NotificationState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set, get) => ({
    notifications: mockNotifications,

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      })),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          status: 'read' as const
        }))
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [{ ...notification, status: 'unread' as const }, ...state.notifications]
      })),

    unreadCount: () => get().notifications.filter((n) => n.status === 'unread').length
  })
  //   ,
  //   { name: 'notifications' }
  // )
);
