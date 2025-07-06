import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
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
      style={[styles.container, { 
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: colors.text
      }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, {
        backgroundColor: theme === 'dark' ? colors.primary : colors.warning
      }]}>
        {theme === 'dark' ? (
          <Sun size={16} color={colors.white} />
        ) : (
          <Moon size={16} color={colors.white} />
        )}
      </View>
      <Text style={[styles.text, { 
        color: colors.text,
        fontWeight: '600'
      }]}>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});