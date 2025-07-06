import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '@/constants/colors';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  colors: typeof LightColors | typeof DarkColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light', // Default to light theme
      colors: LightColors,
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        console.log('Theme toggled from', currentTheme, 'to', newTheme);
        set({
          theme: newTheme,
          colors: newTheme === 'dark' ? DarkColors : LightColors,
        });
      },
      setTheme: (theme: Theme) => {
        console.log('Theme set to', theme);
        set({
          theme,
          colors: theme === 'dark' ? DarkColors : LightColors,
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);