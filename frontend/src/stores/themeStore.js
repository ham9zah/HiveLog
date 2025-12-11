import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark', // Always dark mode
      
      toggleTheme: () => {}, // Disabled
      
      setTheme: () => {}, // Disabled
    }),
    {
      name: 'theme-storage',
      getStorage: () => localStorage,
    }
  )
);
