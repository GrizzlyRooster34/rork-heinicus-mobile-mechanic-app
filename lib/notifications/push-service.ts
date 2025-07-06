import { messaging } from './firebase-admin';
import { prisma } from '../prisma';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  clickAction?: string;
  icon?: string;
  image?: string;
}

export interface NotificationTarget {
  userId?: string;
  userIds?: string[];
  topic?: string;
  tokens?: string[];
}

class PushNotificationService {
  // Send notification to specific user
  async sendToUser(userId: string, notification: PushNotificationData) {
    try {
      // Get user's device tokens
      const user = await prisma.user.findUnique({
        where: { id: userId },
        // Would need to add deviceTokens field to user schema
        // select: { deviceTokens: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // For demo purposes, using a mock token
      const deviceTokens = ['mock-device-token']; // user.deviceTokens || [];

      if (deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
        return { success: false, reason: 'No device tokens' };
      }

      return await this.sendToTokens(deviceTokens, notification);
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds: string[], notification: PushNotificationData) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notification))
    );

    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  // Send notification to device tokens
  async sendToTokens(tokens: string[], notification: PushNotificationData) {
    try {
      if (tokens.length === 0) {
        return { success: false, reason: 'No tokens provided' };
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image,
        },
        data: notification.data || {},
        android: {
          notification: {
            icon: notification.icon || 'ic_notification',
            sound: notification.sound || 'default',
            clickAction: notification.clickAction,
            channelId: 'default',
          },
          data: notification.data || {},
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: notification.badge,
              sound: notification.sound || 'default',
              category: notification.clickAction,
            },
            ...notification.data,
          },
        },
        tokens: tokens,
      };

      const response = await messaging.sendMulticast(message);

      // Log results
      console.log(`Push notification sent: ${response.successCount} successful, ${response.failureCount} failed`);

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          }
        });
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  // Send notification to topic
  async sendToTopic(topic: string, notification: PushNotificationData) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image,
        },
        data: notification.data || {},
        android: {
          notification: {
            icon: notification.icon || 'ic_notification',
            sound: notification.sound || 'default',
            clickAction: notification.clickAction,
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: notification.badge,
              sound: notification.sound || 'default',
              category: notification.clickAction,
            },
          },
        },
        topic: topic,
      };

      const messageId = await messaging.send(message);
      console.log(`Topic notification sent successfully: ${messageId}`);

      return { success: true, messageId };
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }

  // Subscribe user to topic
  async subscribeToTopic(tokens: string[], topic: string) {
    try {
      const response = await messaging.subscribeToTopic(tokens, topic);
      console.log(`Successfully subscribed ${response.successCount} tokens to topic ${topic}`);
      return response;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  // Unsubscribe user from topic
  async unsubscribeFromTopic(tokens: string[], topic: string) {
    try {
      const response = await messaging.unsubscribeFromTopic(tokens, topic);
      console.log(`Successfully unsubscribed ${response.successCount} tokens from topic ${topic}`);
      return response;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  // Job-specific notification templates
  async sendJobNotification(
    jobId: string,
    recipientId: string,
    type: 'job_created' | 'quote_sent' | 'quote_accepted' | 'service_started' | 'service_completed' | 'payment_received',
    extraData?: Record<string, any>
  ) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          customer: true,
          mechanic: true,
        }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      let notification: PushNotificationData;

      switch (type) {
        case 'job_created':
          notification = {
            title: '🔧 New Service Request',
            body: `New job available: ${job.title}`,
            data: {
              type: 'job_update',
              jobId: jobId,
              action: 'view_job',
            },
            clickAction: 'JOB_DETAILS',
          };
          break;

        case 'quote_sent':
          notification = {
            title: '💰 Quote Received',
            body: `${job.mechanic?.firstName} sent you a quote for ${job.title}`,
            data: {
              type: 'quote_received',
              jobId: jobId,
              action: 'view_quote',
            },
            clickAction: 'QUOTE_DETAILS',
          };
          break;

        case 'quote_accepted':
          notification = {
            title: '✅ Quote Accepted',
            body: `Your quote for ${job.title} has been accepted!`,
            data: {
              type: 'quote_accepted',
              jobId: jobId,
              action: 'start_service',
            },
            clickAction: 'JOB_DETAILS',
          };
          break;

        case 'service_started':
          notification = {
            title: '🚗 Service Started',
            body: `${job.mechanic?.firstName} has started working on your ${job.title}`,
            data: {
              type: 'service_started',
              jobId: jobId,
              action: 'track_service',
            },
            clickAction: 'JOB_TRACKING',
          };
          break;

        case 'service_completed':
          notification = {
            title: '🎉 Service Completed',
            body: `Your ${job.title} has been completed!`,
            data: {
              type: 'service_completed',
              jobId: jobId,
              action: 'review_service',
            },
            clickAction: 'REVIEW_SERVICE',
          };
          break;

        case 'payment_received':
          notification = {
            title: '💳 Payment Received',
            body: `Payment received for ${job.title}`,
            data: {
              type: 'payment_received',
              jobId: jobId,
              action: 'view_receipt',
            },
            clickAction: 'PAYMENT_RECEIPT',
          };
          break;

        default:
          throw new Error('Unknown notification type');
      }

      // Add extra data if provided
      if (extraData) {
        notification.data = { ...notification.data, ...extraData };
      }

      // Send notification and save to database
      const result = await this.sendToUser(recipientId, notification);

      // Save notification to database
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'JOB_UPDATE',
          title: notification.title,
          message: notification.body,
          data: notification.data,
          isDelivered: result.success,
        }
      });

      return result;
    } catch (error) {
      console.error('Error sending job notification:', error);
      throw error;
    }
  }

  // Emergency notification
  async sendEmergencyAlert(location: string, customerName: string) {
    try {
      const notification: PushNotificationData = {
        title: '🚨 Emergency Service Request',
        body: `Emergency request from ${customerName} at ${location}`,
        data: {
          type: 'emergency_request',
          priority: 'high',
          action: 'respond_emergency',
        },
        sound: 'emergency_alert',
        clickAction: 'EMERGENCY_RESPONSE',
      };

      // Send to all available mechanics
      return await this.sendToTopic('emergency_mechanics', notification);
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      throw error;
    }
  }

  // Marketing notification
  async sendPromotionalNotification(
    userIds: string[],
    title: string,
    body: string,
    imageUrl?: string,
    deepLink?: string
  ) {
    try {
      const notification: PushNotificationData = {
        title: title,
        body: body,
        image: imageUrl,
        data: {
          type: 'promotional',
          deepLink: deepLink || '',
        },
        clickAction: 'PROMOTION',
      };

      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Error sending promotional notification:', error);
      throw error;
    }
  }

  // Maintenance notification
  async sendMaintenanceReminder(userId: string, vehicleInfo: string, maintenanceType: string) {
    try {
      const notification: PushNotificationData = {
        title: '🔧 Maintenance Reminder',
        body: `Your ${vehicleInfo} is due for ${maintenanceType}`,
        data: {
          type: 'maintenance_reminder',
          maintenanceType: maintenanceType,
          action: 'schedule_maintenance',
        },
        clickAction: 'SCHEDULE_MAINTENANCE',
      };

      return await this.sendToUser(userId, notification);
    } catch (error) {
      console.error('Error sending maintenance reminder:', error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;