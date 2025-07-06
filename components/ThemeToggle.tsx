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
        backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFFFFF', 
        borderColor: theme === 'dark' ? '#3A3A3A' : '#E1E5E9',
        shadowColor: theme === 'dark' ? '#FFFFFF' : '#000000'
      }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, {
        backgroundColor: theme === 'dark' ? '#00BFFF' : '#FFB347'
      }]}>
        {theme === 'dark' ? (
          <Sun size={14} color="#FFFFFF" />
        ) : (
          <Moon size={14} color="#FFFFFF" />
        )}
      </View>
      <Text style={[styles.text, { 
        color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
  },
});