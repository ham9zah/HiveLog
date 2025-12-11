import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setNotifications: (notifications) => set({ notifications }),
  
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== notificationId),
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
}));

export default useNotificationStore;
