import mongoose, { Schema, Document } from 'mongoose';

export type NotificationChannel = 'socket' | 'fcm' | 'email' | 'sms';
export type NotificationStatus = 'queued' | 'sent' | 'failed';

export interface INotification extends Document {
  toUserId: mongoose.Types.ObjectId;
  channel: NotificationChannel;
  type: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channel: {
      type: String,
      enum: ['socket', 'fcm', 'email', 'sms'],
      required: true,
    },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed'],
      default: 'queued',
    },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ toUserId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

