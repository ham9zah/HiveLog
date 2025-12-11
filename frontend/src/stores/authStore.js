import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('token') || null,
      
      setAuth: (user, token) => {
        set({ user, token });
        if (token) {
          localStorage.setItem('token', token);
        }
      },
      
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
      
      isAuthenticated: () => {
        return !!get().token && !!get().user;
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);