import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
  customerId: mongoose.Types.ObjectId;
  label: string;
  addressText: string;
  geo: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, required: true },
    addressText: { type: String, required: true },
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
    phone: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AddressSchema.index({ customerId: 1 });
AddressSchema.index({ geo: '2dsphere' });

export const Address = mongoose.model<IAddress>('Address', AddressSchema);

