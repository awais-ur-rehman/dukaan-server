import { type IUser } from '../../models/User';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    role: string;
    name?: string;
    profileCompleted: boolean;
  };
}

export interface OTPData {
  otpId: string;
  hashedCode: string;
  email: string;
  purpose: 'login' | 'register';
  expiresAt: Date;
  attempts: number;
}

