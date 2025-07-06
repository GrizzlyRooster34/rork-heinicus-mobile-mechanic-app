import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  type?: string;
  jobId?: string;
  action?: string;
  [key: string]: any;
}

export function usePushNotifications() {
  const { user, token } = useAuthStore();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const registerDeviceTokenMutation = trpc.notifications.registerDeviceToken.useMutation();

  // Register for push notifications
  const registerForPushNotificationsAsync = async () => {
    try {
      if (!Device.isDevice) {
        setError('Must use physical device for push notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        setError('Failed to get push token for push notification!');
        return null;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        // Create additional channels for different notification types
        await Promise.all([
          Notifications.setNotificationChannelAsync('job_updates', {
            name: 'Job Updates',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
          }),
          Notifications.setNotificationChannelAsync('chat_messages', {
            name: 'Chat Messages',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 150, 150, 150],
            sound: 'default',
          }),
          Notifications.setNotificationChannelAsync('emergency_alerts', {
            name: 'Emergency Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 100, 100, 100, 100, 100, 100, 100],
            sound: 'emergency_alert',
          }),
          Notifications.setNotificationChannelAsync('payment_updates', {
            name: 'Payment Updates',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 200, 200, 200],
            sound: 'default',
          }),
        ]);
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      setError('Failed to register for push notifications');
      return null;
    }
  };

  // Handle notification received while app is in foreground
  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    setNotification(notification);

    // You can add custom handling here based on notification type
    const data = notification.request.content.data as NotificationData;
    
    if (data.type === 'emergency_request') {
      // Handle emergency notifications differently
      console.log('Emergency notification received');
    }
  };

  // Handle notification tap/click
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification response:', response);
    
    const data = response.notification.request.content.data as NotificationData;
    
    // Navigate based on notification action
    switch (data.action) {
      case 'view_job':
        // Navigate to job details
        console.log('Navigate to job:', data.jobId);
        break;
      case 'view_quote':
        // Navigate to quote
        console.log('Navigate to quote for job:', data.jobId);
        break;
      case 'track_service':
        // Navigate to job tracking
        console.log('Navigate to tracking for job:', data.jobId);
        break;
      case 'review_service':
        // Navigate to review page
        console.log('Navigate to review for job:', data.jobId);
        break;
      default:
        console.log('Default notification action');
    }
  };

  // Initialize push notifications
  useEffect(() => {
    if (!user || !token) return;

    const initializePushNotifications = async () => {
      try {
        const pushToken = await registerForPushNotificationsAsync();
        
        if (pushToken) {
          setExpoPushToken(pushToken);
          
          // Register token with backend
          await registerDeviceTokenMutation.mutateAsync({
            token: pushToken,
            platform: Platform.OS as 'ios' | 'android',
          });

          console.log('Push notifications initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
        setError('Failed to initialize push notifications');
      }
    };

    initializePushNotifications();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user, token]);

  // Send local notification (for testing or immediate feedback)
  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: NotificationData,
    channelId?: string
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null, // Send immediately
        identifier: Date.now().toString(),
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Set badge count
  const setBadgeCount = async (count: number) => {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  };

  // Get notification permissions status
  const getPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting permission status:', error);
      return 'undetermined';
    }
  };

  // Request permissions (if not already granted)
  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  // Cancel scheduled notification
  const cancelNotification = async (identifier: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  // Schedule notification for later
  const scheduleNotification = async (
    title: string,
    body: string,
    triggerDate: Date,
    data?: NotificationData
  ) => {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: {
          type: 'date',
          date: triggerDate,
        } as any,
      });
      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  return {
    expoPushToken,
    notification,
    error,
    
    // Actions
    sendLocalNotification,
    clearAllNotifications,
    setBadgeCount,
    getPermissionStatus,
    requestPermissions,
    cancelNotification,
    scheduleNotification,
    
    // Status
    isRegistered: !!expoPushToken,
    hasError: !!error,
  };
}

export default usePushNotifications;