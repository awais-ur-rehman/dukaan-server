import { Notification, type INotification } from '../../models/Notification';
import mongoose from 'mongoose';

export class NotificationRepository {
  async findByUserId(
    userId: string,
    page: number,
    limit: number,
    unreadOnly?: boolean
  ): Promise<{ notifications: INotification[]; total: number }> {
    const query: any = { toUserId: new mongoose.Types.ObjectId(userId) };
    
    if (unreadOnly) {
      query.status = { $ne: 'read' };
    }

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { notifications, total };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        toUserId: new mongoose.Types.ObjectId(userId),
      },
      { status: 'read' }
    ).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { toUserId: new mongoose.Types.ObjectId(userId) },
      { status: 'read' }
    ).exec();
  }
}

