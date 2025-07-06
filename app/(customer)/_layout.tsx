import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import * as Icons from 'lucide-react-native';

function TabBarIcon({ name, color }: { name: keyof typeof Icons; color: string }) {
  const IconComponent = Icons[name] as any;
  return IconComponent ? <IconComponent size={24} color={color} /> : null;
}

export default function CustomerTabLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { colors } = useThemeStore();

  // Redirect to auth if not authenticated or not a customer
  if (!isAuthenticated || !user || user.role !== 'customer') {
    return <Redirect href="/auth" />;
  }

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
          title: 'Home',
          headerTitle: 'Heinicus Mobile Mechanic',
          tabBarIcon: ({ color }) => <TabBarIcon name="Home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="request"
        options={{
          title: 'Request Service',
          tabBarIcon: ({ color }) => <TabBarIcon name="Wrench" color={color} />,
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: 'My Quotes',
          tabBarIcon: ({ color }) => <TabBarIcon name="FileText" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <TabBarIcon name="Calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="User" color={color} />,
        }}
      />
    </Tabs>
  );
}