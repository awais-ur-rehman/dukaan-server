import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'customer' | 'merchant_owner' | 'rider' | 'admin' | 'super_admin';

export interface RefreshToken {
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  role: UserRole;
  email: string;
  phone?: string;
  name?: string;
  passwordHash?: string;
  profileCompleted: boolean;
  locale?: string;
  refreshTokens?: RefreshToken[];
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<RefreshToken>(
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    role: {
      type: String,
      enum: ['customer', 'merchant_owner', 'rider', 'admin', 'super_admin'],
      required: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    name: { type: String, trim: true },
    passwordHash: { type: String },
    profileCompleted: { type: Boolean, default: false },
    locale: { type: String, default: 'en' },
    refreshTokens: [RefreshTokenSchema],
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', UserSchema);

