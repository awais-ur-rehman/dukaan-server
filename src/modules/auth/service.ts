import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { redisClient } from '../../config/redis';
import { config } from '../../config/env';
import { sendOTPEmail } from '../../utils/email';
import { generateAccessToken, generateRefreshToken, type TokenPayload } from '../../utils/jwt';
import { AuthRepository } from './repository';
import { type AuthResponse, type OTPData } from './types';
import { AppError } from '../../middleware/errorHandler';

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async sendOTP(email: string, purpose: 'login' | 'register'): Promise<{ otpId: string }> {
    const normalizedEmail = email.toLowerCase();
    const rateLimitKey = `otp:rate:${normalizedEmail}`;
    const rateLimitCount = await redisClient.get(rateLimitKey);

    if (rateLimitCount && parseInt(rateLimitCount) >= config.otp.maxRequestsPerHour) {
      throw new AppError('Too many OTP requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = uuidv4();
    const hashedCode = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + config.otp.ttlSeconds * 1000);

    const otpData: OTPData = {
      otpId,
      hashedCode,
      email: normalizedEmail,
      purpose,
      expiresAt,
      attempts: 0,
    };

    await redisClient.setEx(
      `otp:${otpId}`,
      config.otp.ttlSeconds,
      JSON.stringify(otpData)
    );

    await redisClient.incr(rateLimitKey);
    await redisClient.expire(rateLimitKey, 3600);

    await sendOTPEmail(normalizedEmail, otp, otpId);

    return { otpId };
  }

  async verifyOTP(otpId: string, code: string): Promise<AuthResponse> {
    const otpDataStr = await redisClient.get(`otp:${otpId}`);
    if (!otpDataStr) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    const otpData: OTPData = JSON.parse(otpDataStr);

    if (otpData.attempts >= config.otp.maxAttempts) {
      throw new AppError('Maximum OTP attempts exceeded', 429, 'OTP_LOCKED');
    }

    if (otpData.expiresAt < new Date()) {
      await redisClient.del(`otp:${otpId}`);
      throw new AppError('OTP expired', 400, 'OTP_EXPIRED');
    }

    const isValid = await bcrypt.compare(code, otpData.hashedCode);
    if (!isValid) {
      otpData.attempts += 1;
      await redisClient.setEx(
        `otp:${otpId}`,
        config.otp.ttlSeconds,
        JSON.stringify(otpData)
      );
      throw new AppError('Invalid OTP code', 400, 'INVALID_OTP');
    }

    await redisClient.del(`otp:${otpId}`);

    let user = await this.repository.findByEmail(otpData.email);

    if (otpData.purpose === 'register' && user) {
      throw new AppError('User already exists. Use login instead.', 409, 'USER_EXISTS');
    }

    if (otpData.purpose === 'login' && !user) {
      throw new AppError('User not found. Please register first.', 404, 'USER_NOT_FOUND');
    }

    if (!user) {
      const role = 'customer';
      user = await this.repository.createUser(otpData.email, role);
    }

    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + config.jwtRefreshTtlDays * 24 * 60 * 60 * 1000);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.repository.addRefreshToken(user._id.toString(), refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        profileCompleted: user.profileCompleted,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const { verifyToken } = await import('../../utils/jwt');
      const payload = verifyToken(refreshToken);

      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const isValid = await this.repository.findRefreshToken(payload.userId, refreshTokenHash);

      if (!isValid) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      const newTokenPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      const accessToken = generateAccessToken(newTokenPayload);
      return { accessToken };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.repository.removeRefreshToken(userId, refreshTokenHash);
  }
}

