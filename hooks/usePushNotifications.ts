import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getProjectId = () =>
  Constants.easConfig?.projectId ||
  ((Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? null) ||
  process.env.EAS_PROJECT_ID ||
  null;

export const usePushNotifications = () => {
  const user = useAuthStore((state) => state.user);
  const registerMutation = trpc.notifications.register.useMutation();
  const lastRegisteredToken = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || Platform.OS === 'web' || !Device.isDevice || registerMutation.isPending) {
      return;
    }

    const register = async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        const currentPermissions = await Notifications.getPermissionsAsync();
        let status = currentPermissions.status;

        if (status !== 'granted') {
          const requestedPermissions = await Notifications.requestPermissionsAsync();
          status = requestedPermissions.status;
        }

        if (status !== 'granted') {
          return;
        }

        const projectId = getProjectId();
        if (!projectId) {
          console.warn('Push notifications skipped: missing Expo project ID');
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenResponse.data;

        if (!token || token === lastRegisteredToken.current) {
          return;
        }

        await registerMutation.mutateAsync({
          token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          deviceId: Application.applicationId ?? undefined,
        });

        lastRegisteredToken.current = token;
      } catch (error) {
        console.warn('Push notification registration failed', error);
      }
    };

    void register();
  }, [registerMutation, user?.id]);
};
