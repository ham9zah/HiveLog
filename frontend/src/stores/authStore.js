import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
      user: null,
      token: null,
      
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
}));