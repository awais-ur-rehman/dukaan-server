import mongoose, { Schema, Document } from 'mongoose';

export type DisputeStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type DisputeType = 'ORDER_QUALITY' | 'MISSING_ITEMS' | 'WRONG_ITEMS' | 'PAYMENT_ISSUE' | 'DELIVERY_ISSUE' | 'OTHER';

export interface DisputeComment {
  userId: mongoose.Types.ObjectId;
  role: string;
  message: string;
  createdAt: Date;
}

export interface IDispute extends Document {
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  type: DisputeType;
  reason: string;
  status: DisputeStatus;
  comments: DisputeComment[];
  adminId?: mongoose.Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeCommentSchema = new Schema<DisputeComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DisputeSchema = new Schema<IDispute>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    type: {
      type: String,
      enum: ['ORDER_QUALITY', 'MISSING_ITEMS', 'WRONG_ITEMS', 'PAYMENT_ISSUE', 'DELIVERY_ISSUE', 'OTHER'],
      required: true,
    },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    comments: [DisputeCommentSchema],
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

DisputeSchema.index({ orderId: 1 });
DisputeSchema.index({ customerId: 1, status: 1 });
DisputeSchema.index({ merchantId: 1, status: 1 });

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);

