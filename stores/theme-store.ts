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
      theme: 'dark',
      colors: DarkColors,
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        set({
          theme: newTheme,
          colors: newTheme === 'dark' ? DarkColors : LightColors,
        });
      },
      setTheme: (theme: Theme) => {
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