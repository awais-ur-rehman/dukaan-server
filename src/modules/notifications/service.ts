import { Notification, type INotification } from '../../models/Notification';
import { redisClient } from '../../config/redis';
import { config } from '../../config/env';
import admin from 'firebase-admin';

let fcmInitialized = false;

const initializeFCM = (): void => {
  if (fcmInitialized || admin.apps.length > 0) {
    return;
  }

  const projectId = process.env.FCM_PROJECT_ID;
  const privateKey = process.env.FCM_PRIVATE_KEY;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;

  if (config.fcmServerKey && projectId && privateKey && clientEmail) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
      });
      fcmInitialized = true;
    } catch (error) {
      console.warn('FCM initialization failed:', error);
    }
  }
};

export class NotificationService {
  async send(data: {
    toUserId: string;
    channels: Array<'socket' | 'fcm' | 'email' | 'sms'>;
    type: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    for (const channel of data.channels) {
      const notification = new Notification({
        toUserId: data.toUserId,
        channel,
        type: data.type,
        payload: data.payload,
        status: 'queued',
      });

      await notification.save();

      try {
        if (channel === 'socket') {
          await this.sendSocket(data.toUserId, data.type, data.payload);
          notification.status = 'sent';
          notification.sentAt = new Date();
        } else if (channel === 'fcm') {
          await this.sendFCM(data.toUserId, data.type, data.payload);
          notification.status = 'sent';
          notification.sentAt = new Date();
        } else if (channel === 'email') {
          await this.sendEmail(data.toUserId, data.type, data.payload);
          notification.status = 'sent';
          notification.sentAt = new Date();
        }

        await notification.save();
      } catch (error) {
        notification.status = 'failed';
        await notification.save();
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  private async sendSocket(userId: string, type: string, payload: Record<string, unknown>): Promise<void> {
    const socketKey = `socket:user:${userId}`;
    const socketIds = await redisClient.sMembers(socketKey);

    if (socketIds.length === 0) {
      throw new Error('User not connected');
    }

    const io = (global as any).io;
    if (!io) {
      throw new Error('Socket.IO not initialized');
    }

    for (const socketId of socketIds) {
      io.to(socketId).emit(type, payload);
    }
  }

  private async sendFCM(userId: string, type: string, payload: Record<string, unknown>): Promise<void> {
    initializeFCM();
    
    if (!admin.apps.length) {
      throw new Error('FCM not initialized');
    }

    const fcmTokenKey = `fcm:token:${userId}`;
    const tokens = await redisClient.sMembers(fcmTokenKey);

    if (tokens.length === 0) {
      throw new Error('No FCM tokens found');
    }

    const message = {
      notification: {
        title: payload.title as string || 'Dukaan Notification',
        body: payload.body as string || 'You have a new notification',
      },
      data: {
        type,
        ...payload,
      },
      tokens,
    };

    await admin.messaging().sendEachForMulticast(message);
  }

  private async sendEmail(userId: string, type: string, payload: Record<string, unknown>): Promise<void> {
    const userKey = `user:email:${userId}`;
    const email = await redisClient.get(userKey);

    if (!email) {
      throw new Error('User email not found');
    }

    const { sendNotificationEmail } = await import('../../utils/email');
    await sendNotificationEmail(
      email,
      payload.subject as string || 'Dukaan Notification',
      payload.html as string || JSON.stringify(payload)
    );
  }
}

