import mongoose, { Schema, Document } from 'mongoose';

export interface MultilingualText {
  en: string;
  ur?: string;
}

export interface AddressText {
  en: string;
  ur?: string;
}

export interface OpeningHoursSlot {
  start: string;
  end: string;
}

export interface OpeningHours {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  slots: OpeningHoursSlot[];
}

export interface Verification {
  adminId?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  notes?: string;
  docUrls?: string[];
}

export interface MerchantSettings {
  autoAcceptOrders: boolean;
  maxDeliverySlotsPerDay: number;
}

export interface IMerchant extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  names: MultilingualText;
  shopAddress: {
    text: AddressText;
    street?: string;
  };
  geo: {
    type: 'Point';
    coordinates: [number, number];
  };
  deliveryRadiusMeters: number;
  deliveryCharge: number;
  openingHours: OpeningHours[];
  isApproved: boolean;
  verification: Verification;
  riders: mongoose.Types.ObjectId[];
  settings: MerchantSettings;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema = new Schema<IMerchant>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    names: {
      en: { type: String, required: true },
      ur: { type: String },
    },
    shopAddress: {
      text: {
        en: { type: String, required: true },
        ur: { type: String },
      },
      street: { type: String },
    },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    deliveryRadiusMeters: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0 },
    openingHours: [
      {
        day: {
          type: String,
          enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          required: true,
        },
        slots: [
          {
            start: { type: String, required: true },
            end: { type: String, required: true },
          },
        ],
      },
    ],
    isApproved: { type: Boolean, default: false },
    verification: {
      adminId: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
      notes: { type: String },
      docUrls: [{ type: String }],
    },
    riders: [{ type: Schema.Types.ObjectId, ref: 'Rider' }],
    settings: {
      autoAcceptOrders: { type: Boolean, default: false },
      maxDeliverySlotsPerDay: { type: Number, default: 50 },
    },
  },
  { timestamps: true }
);

MerchantSchema.index({ geo: '2dsphere' });
MerchantSchema.index({ ownerUserId: 1 });

export const Merchant = mongoose.model<IMerchant>('Merchant', MerchantSchema);

