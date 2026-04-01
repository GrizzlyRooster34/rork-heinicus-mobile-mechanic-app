const mockPrisma = {
  pushToken: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  notificationPref: {
    findUnique: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
};

const mockChunkPushNotifications = jest.fn((messages) => [messages]);
const mockSendPushNotificationsAsync = jest.fn(async (messages) =>
  messages.map(() => ({ status: 'ok' }))
);

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('expo-server-sdk', () => {
  class Expo {
    static isExpoPushToken(token: string) {
      return token.startsWith('ExponentPushToken[');
    }

    chunkPushNotifications(messages: unknown[]) {
      return mockChunkPushNotifications(messages);
    }

    sendPushNotificationsAsync(messages: unknown[]) {
      return mockSendPushNotificationsAsync(messages);
    }
  }

  return { Expo };
});

import { NotificationType } from '@prisma/client';
import { savePushToken, sendJobStatusNotification } from '@/backend/services/notifications';

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.pushToken.findUnique.mockResolvedValue(null);
    mockPrisma.pushToken.upsert.mockResolvedValue({});
    mockPrisma.pushToken.findMany.mockResolvedValue([{ token: 'ExponentPushToken[test-token]' }]);
    mockPrisma.notificationPref.findUnique.mockResolvedValue({ push: true });
    mockPrisma.notification.create.mockResolvedValue({ id: 'notification-1' });
  });

  it('savePushToken creates or updates the token record', async () => {
    const result = await savePushToken(
      'user-1',
      'ExponentPushToken[test-token]',
      'android',
      'device-1'
    );

    expect(result).toEqual({ success: true });
    expect(mockPrisma.pushToken.upsert).toHaveBeenCalledWith({
      where: { token: 'ExponentPushToken[test-token]' },
      create: {
        userId: 'user-1',
        token: 'ExponentPushToken[test-token]',
        platform: 'android',
        deviceId: 'device-1',
      },
      update: {
        platform: 'android',
        deviceId: 'device-1',
        userId: 'user-1',
      },
    });
  });

  it('sendJobStatusNotification constructs and sends the expected payload', async () => {
    const result = await sendJobStatusNotification('user-1', 'job-1', 'IN_PROGRESS');

    expect(result).toEqual({ success: true, delivered: 1 });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        title: 'Job Status Updated',
        body: 'Your job status is now IN_PROGRESS.',
        type: NotificationType.JOB_UPDATE,
        data: {
          jobId: 'job-1',
          status: 'IN_PROGRESS',
        },
        jobId: 'job-1',
        messageId: undefined,
        quoteId: undefined,
      },
      select: { id: true },
    });
    expect(mockChunkPushNotifications).toHaveBeenCalledTimes(1);
    expect(mockSendPushNotificationsAsync).toHaveBeenCalledWith([
      expect.objectContaining({
        to: 'ExponentPushToken[test-token]',
        title: 'Job Status Updated',
        body: 'Your job status is now IN_PROGRESS.',
        data: expect.objectContaining({
          notificationId: 'notification-1',
          jobId: 'job-1',
          status: 'IN_PROGRESS',
          type: NotificationType.JOB_UPDATE,
          userId: 'user-1',
        }),
      }),
    ]);
  });
});
