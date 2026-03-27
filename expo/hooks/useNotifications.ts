import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { trpcClient } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification data interface
 */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  createdAt: Date;
  type: string;
}

/**
 * useNotifications Hook
 *
 * Manages push notifications:
 * - Permission requests
 * - Token registration
 * - Notification listeners
 * - Notification badge management
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [permissionStatus, setPermissionStatus] = useState<string>('');

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  /**
   * Register for push notifications
   */
  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus !== 'granted') {
        console.warn('Permission to send notifications was denied');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      const token = tokenData.data;
      setExpoPushToken(token);

      // Register token with backend if user is logged in
      if (userId && token) {
        const platform = Platform.OS as 'ios' | 'android' | 'web';
        const deviceId = Device.osInternalBuildId;

        await trpcClient.notifications.registerToken.mutate({
          userId,
          token,
          platform,
          deviceId,
        });

        console.log('Push token registered:', token);
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }, [userId]);

  /**
   * Fetch user notifications from backend
   */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await trpcClient.notifications.getNotifications.query({
        userId,
        limit: 50,
      });

      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await trpcClient.notifications.getUnreadCount.query({
        userId,
      });

      if (result.success) {
        setUnreadCount(result.count);

        // Update app badge
        await Notifications.setBadgeCountAsync(result.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [userId]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await trpcClient.notifications.markAsRead.mutate({
        notificationId,
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      // Refresh unread count
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await trpcClient.notifications.markAllAsRead.mutate({
        userId,
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );

      // Reset unread count
      setUnreadCount(0);
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [userId]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await trpcClient.notifications.deleteNotification.mutate({
        notificationId,
      });

      // Remove from local state
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );

      // Refresh unread count
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [fetchUnreadCount]);

  /**
   * Send test notification (development only)
   */
  const sendTestNotification = useCallback(async () => {
    if (!userId) return;

    try {
      await trpcClient.notifications.sendTestNotification.mutate({
        userId,
        title: 'Test Notification',
        body: 'This is a test notification!',
      });

      console.log('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, [userId]);

  // Register for push notifications on mount
  useEffect(() => {
    if (userId) {
      registerForPushNotifications();
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [userId, registerForPushNotifications, fetchNotifications, fetchUnreadCount]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        setNotification(notification);

        // Refresh notifications list
        fetchNotifications();
        fetchUnreadCount();
      }
    );

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);

        const data = response.notification.request.content.data;

        // Handle navigation based on notification type
        if (data.jobId) {
          // Navigate to job details
          console.log('Navigate to job:', data.jobId);
        } else if (data.messageId) {
          // Navigate to chat
          console.log('Navigate to message:', data.messageId);
        }

        // Mark as read
        if (data.notificationId) {
          markAsRead(data.notificationId);
        }
      }
    );

    // Cleanup listeners
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [fetchNotifications, fetchUnreadCount, markAsRead]);

  // Clear badge when app is opened
  useEffect(() => {
    Notifications.setBadgeCountAsync(0);
  }, []);

  return {
    // State
    expoPushToken,
    notification,
    notifications,
    unreadCount,
    permissionStatus,

    // Methods
    registerForPushNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification,
  };
}
