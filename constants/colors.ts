// Heinicus Designs brand colors - dark theme only
export const Colors = {
  // Primary brand colors - matching Heinicus Designs logo
  primary: '#00BFFF',        // Bright cyan from logo
  primaryDark: '#0099CC',    // Darker cyan for pressed states
  secondary: '#00A3E0',      // Secondary blue
  
  // Role-specific colors
  mechanic: '#00BFFF',       // Use brand color for mechanic
  customer: '#00BFFF',       // Use brand color for customer
  admin: '#00D4FF',          // Lighter cyan for admin
  
  // Background colors
  background: '#000000',     // Pure black like logo background
  surface: '#1A1A1A',       // Very dark gray for cards
  card: '#2A2A2A',          // Slightly lighter for elevated cards
  
  // Border and divider colors
  border: '#333333',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textMuted: '#999999',
  
  // Status colors
  success: '#00FF88',
  successBackground: '#003322',
  warning: '#FFB800',
  error: '#FF4444',
  errorBackground: '#330000',
  info: '#00BFFF',          // Use brand color for info
  
  // Utility colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Development colors
  development: '#FFB800',
};

// Legacy exports for compatibility
export const LightColors = Colors;
export const DarkColors = Colors;