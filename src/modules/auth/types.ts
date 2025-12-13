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
  purpose: 'login' | 'register' | 'password-reset' | 'signup';
  expiresAt: Date;
  attempts: number;
  // Additional data for signup
  signupData?: {
    name: string;
    phone: string;
    passwordHash: string;
  };
}

