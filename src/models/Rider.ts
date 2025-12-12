import mongoose, { Schema, Document } from 'mongoose';

export interface CurrentLocation {
  coordinates: [number, number];
  updatedAt: Date;
}

export interface Earnings {
  today: number;
  week: number;
  total: number;
}

export interface IRider extends Document {
  merchantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  vehicleType?: string;
  active: boolean;
  currentLocation?: CurrentLocation;
  earnings: Earnings;
  createdAt: Date;
  updatedAt: Date;
}

const RiderSchema = new Schema<IRider>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleType: { type: String },
    active: { type: Boolean, default: true },
    currentLocation: {
      coordinates: {
        type: [Number],
        default: undefined,
      },
      updatedAt: { type: Date },
    },
    earnings: {
      today: { type: Number, default: 0 },
      week: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

RiderSchema.index({ merchantId: 1 });
RiderSchema.index({ userId: 1 });

export const Rider = mongoose.model<IRider>('Rider', RiderSchema);

