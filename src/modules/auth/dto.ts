import { z } from 'zod';

export const sendOTPDto = z.object({
  email: z.string().email('Invalid email format'),
  purpose: z.enum(['login', 'register', 'password-reset'], {
    errorMap: () => ({ message: 'Purpose must be login, register, or password-reset' }),
  }),
});

export const verifyOTPDto = z.object({
  otpId: z.string().min(1, 'OTP ID is required'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

export const refreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const signupDto = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const verifySignupOtpDto = z.object({
  otpId: z.string().min(1, 'OTP ID is required'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

export const loginDto = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordRequestDto = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordDto = z.object({
  otpId: z.string().min(1, 'OTP ID is required'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export type SendOTPRequest = z.infer<typeof sendOTPDto>;
export type VerifyOTPRequest = z.infer<typeof verifyOTPDto>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenDto>;
export type SignupRequest = z.infer<typeof signupDto>;
export type VerifySignupOtpRequest = z.infer<typeof verifySignupOtpDto>;
export type LoginRequest = z.infer<typeof loginDto>;
export type ResetPasswordRequestRequest = z.infer<typeof resetPasswordRequestDto>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordDto>;

