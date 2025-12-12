import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true }
);

FeedbackSchema.index({ orderId: 1 }, { unique: true });
FeedbackSchema.index({ merchantId: 1, createdAt: -1 });
FeedbackSchema.index({ customerId: 1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

