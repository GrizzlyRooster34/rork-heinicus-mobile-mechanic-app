import { create } from 'zustand';

// Always use dark theme - no persistence needed
export type Theme = 'dark';

const DarkColors = {
  // Primary brand colors
  primary: '#0A84FF',
  primaryDark: '#0056CC',
  secondary: '#5E5CE6',
  
  // Role-specific colors
  mechanic: '#FF6B35',
  customer: '#0A84FF',
  admin: '#BF5AF2',
  
  // Background colors
  background: '#000000',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  
  // Border and divider colors
  border: '#38383A',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted: '#8E8E93',
  
  // Status colors
  success: '#30D158',
  successBackground: '#1E3A1E',
  warning: '#FF9F0A',
  error: '#FF453A',
  errorBackground: '#3A1E1E',
  info: '#64D2FF',
  
  // Utility colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Development colors
  development: '#FF9F0A',
};

interface ThemeState {
  theme: Theme;
  colors: typeof DarkColors;
}

export const useThemeStore = create<ThemeState>(() => ({
  theme: 'dark',
  colors: DarkColors,
}));