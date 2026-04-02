import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { LayoutDashboard, Briefcase, Map, Users, Settings } from 'lucide-react-native';
import { logger } from '@/utils/logger';

type IconName = 'LayoutDashboard' | 'Briefcase' | 'Map' | 'Users' | 'Settings';

function TabBarIcon({ name, color }: { name: IconName; color: string }) {
  const iconMap = {
    LayoutDashboard,
    Briefcase,
    Map,
    Users,
    Settings,
  };
  const IconComponent = iconMap[name];
  return <IconComponent size={24} color={color} />;
}

export default function MechanicTabLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { colors } = useThemeStore();

  // Production security: Only allow Cody as mechanic
  if (!isAuthenticated || !user || user.role !== 'mechanic' || user.id !== 'mechanic-cody') {
    logger.warn('Unauthorized mechanic access attempt', { 
      isAuthenticated, 
      userId: user?.id, 
      role: user?.role,
      timestamp: new Date().toISOString() 
    });
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
            title: 'Dashboard',
            headerTitle: 'Mechanic Dashboard',
            tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="LayoutDashboard" color={color} />,
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: 'Jobs',
            tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="Briefcase" color={color} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="Map" color={color} />,
          }}
        />
        <Tabs.Screen
          name="customers"
          options={{
            title: 'Customers',
            tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="Users" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="Settings" color={color} />,
          }}
        />
      </Tabs>
  );
}
