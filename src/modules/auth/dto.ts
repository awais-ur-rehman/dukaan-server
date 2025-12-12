import { z } from 'zod';

export const sendOTPDto = z.object({
  email: z.string().email('Invalid email format'),
  purpose: z.enum(['login', 'register'], {
    errorMap: () => ({ message: 'Purpose must be either login or register' }),
  }),
});

export const verifyOTPDto = z.object({
  otpId: z.string().min(1, 'OTP ID is required'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

export const refreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type SendOTPRequest = z.infer<typeof sendOTPDto>;
export type VerifyOTPRequest = z.infer<typeof verifyOTPDto>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenDto>;

