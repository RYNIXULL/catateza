import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { soundManager } from '../lib/sound';

export type NotificationType = 'stock' | 'transaction' | 'cashflow' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string; // ISO string
  isRead: boolean;
  link?: string;
  badge?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (item: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    badge?: string;
  }) => void;
}

const defaultInitialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Peringatan Stok Menipis',
    message: 'Stok produk "baju" di Cabang Aussie tersisa sedikit. Segera periksa inventaris.',
    type: 'stock',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    isRead: false,
    link: '/inventory',
    badge: 'Stok Rendah',
  },
  {
    id: 'notif-2',
    title: 'Penjualan Berhasil',
    message: 'Transaksi INV-20260830-0002 berhasil dibayar sebesar Rp 90.000.',
    type: 'transaction',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isRead: false,
    link: '/reports',
    badge: 'Penjualan',
  },
  {
    id: 'notif-3',
    title: 'Kasir Selesai Shift',
    message: 'Sesi kasir harian di Cabang Pusat telah tercatat dan siap untuk verifikasi kas.',
    type: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    isRead: true,
    link: '/branches',
    badge: 'Operasional',
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: defaultInitialNotifications,

      markAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      deleteNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () =>
        set({
          notifications: [],
        }),

      addNotification: (item) => {
        if (item.type === 'stock') {
          soundManager.playWarning();
        } else if (item.type === 'transaction') {
          soundManager.playSuccess();
        } else {
          soundManager.playNotification();
        }

        set((state) => {
          const newNotif: NotificationItem = {
            id: 'notif-' + Date.now(),
            ...item,
            timestamp: new Date().toISOString(),
            isRead: false,
          };
          return {
            notifications: [newNotif, ...state.notifications],
          };
        });
      },
    }),
    {
      name: 'smartpos_notifications_v1',
    }
  )
);
