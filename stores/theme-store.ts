import { create } from 'zustand';
import { Colors } from '@/constants/colors';

// Always use dark theme - integrated with existing color system
export type Theme = 'dark';

interface ThemeState {
  theme: Theme;
  colors: typeof Colors;
  // Optional theme features
  isDarkMode: boolean;
  toggleTheme?: () => void; // For future expansion
}

export const useThemeStore = create<ThemeState>(() => ({
  theme: 'dark',
  colors: Colors, // Use existing color system from constants/colors.ts
  isDarkMode: true,
  // Theme toggle is disabled for now - always dark mode
  toggleTheme: undefined,
}));