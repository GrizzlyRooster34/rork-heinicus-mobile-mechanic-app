import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useThemeStore } from '@/stores/theme-store';
import { Sun, Moon } from 'lucide-react-native';

export function ThemeToggle() {
  const { theme, colors, toggleTheme } = useThemeStore();

  // Don't render on web to avoid hydration issues
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      {theme === 'dark' ? (
        <Sun size={16} color={colors.text} />
      ) : (
        <Moon size={16} color={colors.text} />
      )}
      <Text style={[styles.text, { color: colors.text }]}>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});