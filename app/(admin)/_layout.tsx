import { Tabs } from 'expo-router';
import { useThemeStore } from '@/stores/theme-store';
import * as Icons from 'lucide-react-native';

export default function AdminLayout() {
  const { colors } = useThemeStore();

  return (
    <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Icons.BarChart3 size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarIcon: ({ color, size }) => (
              <Icons.Users size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="quotes"
          options={{
            title: 'Quotes',
            tabBarIcon: ({ color, size }) => (
              <Icons.FileText size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: 'Jobs',
            tabBarIcon: ({ color, size }) => (
              <Icons.Briefcase size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Icons.Settings size={size} color={color} />
            ),
          }}
        />
      </Tabs>
  );
}