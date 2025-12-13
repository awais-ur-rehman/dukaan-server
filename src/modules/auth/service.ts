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

  async sendOTP(email: string, purpose: 'login' | 'register' | 'password-reset'): Promise<{ otpId: string }> {
    const normalizedEmail = email.toLowerCase();
    
    // Rate limiting disabled for development
    // const rateLimitKey = `otp:rate:${normalizedEmail}`;
    // const rateLimitCount = await redisClient.get(rateLimitKey);
    // if (rateLimitCount && parseInt(rateLimitCount) >= config.otp.maxRequestsPerHour) {
    //   throw new AppError('Too many OTP requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    // }

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

    // Rate limiting disabled for development
    // await redisClient.incr(rateLimitKey);
    // await redisClient.expire(rateLimitKey, 3600);

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
      
      // First verify the JWT token structure and expiry
      const payload = verifyToken(refreshToken);

      // Get user to check stored refresh tokens
      const user = await this.repository.findById(payload.userId);
      if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Check if any stored token hash matches the incoming token
      // We need to compare the incoming token with each stored hash
      let tokenFound = false;
      const now = new Date();

      for (const storedToken of user.refreshTokens) {
        // Check expiry first
        if (storedToken.expiresAt <= now) {
          continue; // Skip expired tokens
        }

        // Compare the incoming token with stored hash using bcrypt
        try {
          const matches = await bcrypt.compare(refreshToken, storedToken.tokenHash);
          if (matches) {
            tokenFound = true;
            break;
          }
        } catch (compareError) {
          // Continue to next token if comparison fails
          continue;
        }
      }

      if (!tokenFound) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Generate new access token
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
      // Handle JWT verification errors
      if (error instanceof Error && error.message.includes('expired')) {
        throw new AppError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
      }
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Verify token to get userId (already have it, but verify structure)
    try {
      const { verifyToken } = await import('../../utils/jwt');
      verifyToken(refreshToken); // Verify it's a valid JWT
    } catch (error) {
      // If token is invalid, still proceed with logout (idempotent)
    }

    // Get user to find matching token hash
    const user = await this.repository.findById(userId);
    if (!user || !user.refreshTokens) return;

    // Find and remove matching token
    for (const storedToken of user.refreshTokens) {
      try {
        const matches = await bcrypt.compare(refreshToken, storedToken.tokenHash);
        if (matches) {
          await this.repository.removeRefreshToken(userId, storedToken.tokenHash);
          break;
        }
      } catch (error) {
        // Continue to next token
        continue;
      }
    }
  }

  async signup(name: string, email: string, phone: string, password: string): Promise<{ otpId: string }> {
    const normalizedEmail = email.toLowerCase();
    
    // Check if user already exists
    const existingUser = await this.repository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('User already exists. Use login instead.', 409, 'USER_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = uuidv4();
    const hashedCode = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + config.otp.ttlSeconds * 1000);

    const otpData: OTPData = {
      otpId,
      hashedCode,
      email: normalizedEmail,
      purpose: 'signup',
      expiresAt,
      attempts: 0,
      signupData: {
        name,
        phone,
        passwordHash,
      },
    };

    await redisClient.setEx(
      `otp:${otpId}`,
      config.otp.ttlSeconds,
      JSON.stringify(otpData)
    );

    await sendOTPEmail(normalizedEmail, otp, otpId);

    return { otpId };
  }

  async verifySignupOtp(otpId: string, code: string): Promise<AuthResponse> {
    const otpDataStr = await redisClient.get(`otp:${otpId}`);
    if (!otpDataStr) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    const otpData: OTPData = JSON.parse(otpDataStr);

    if (otpData.purpose !== 'signup' || !otpData.signupData) {
      throw new AppError('Invalid OTP purpose', 400, 'INVALID_OTP');
    }

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

    // Check if user already exists
    let user = await this.repository.findByEmail(otpData.email);
    if (user) {
      throw new AppError('User already exists', 409, 'USER_EXISTS');
    }

    // Create user with merchant_owner role and password
    user = await this.repository.createUser(
      otpData.email,
      'merchant_owner',
      otpData.signupData.name,
      otpData.signupData.phone,
      otpData.signupData.passwordHash
    );

    // Mark profile as completed
    await this.repository.updateUser(user._id.toString(), { profileCompleted: true });

    // Generate tokens
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
        profileCompleted: user.profileCompleted || false,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase();

    const user = await this.repository.verifyPasswordByEmail(normalizedEmail, password);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
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
        profileCompleted: user.profileCompleted || false,
      },
    };
  }

  async riderLogin(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase();

    const user = await this.repository.verifyPasswordByEmail(normalizedEmail, password);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.role !== 'rider') {
      throw new AppError('Access denied. Rider account required.', 403, 'FORBIDDEN');
    }

    // Generate tokens
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
        profileCompleted: user.profileCompleted || false,
      },
    };
  }

  async requestPasswordReset(email: string): Promise<{ otpId: string }> {
    const normalizedEmail = email.toLowerCase();
    
    const user = await this.repository.findByEmail(normalizedEmail);
    if (!user) {
      // Don't reveal if user exists (security best practice)
      // Still return success to prevent email enumeration
      throw new AppError('If an account exists with this email, a password reset OTP has been sent.', 200, 'OTP_SENT');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = uuidv4();
    const hashedCode = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + config.otp.ttlSeconds * 1000);

    const otpData: OTPData = {
      otpId,
      hashedCode,
      email: normalizedEmail,
      purpose: 'password-reset',
      expiresAt,
      attempts: 0,
    };

    await redisClient.setEx(
      `otp:${otpId}`,
      config.otp.ttlSeconds,
      JSON.stringify(otpData)
    );

    await sendOTPEmail(normalizedEmail, otp, otpId);

    return { otpId };
  }

  async resetPassword(otpId: string, code: string, newPassword: string): Promise<void> {
    const otpDataStr = await redisClient.get(`otp:${otpId}`);
    if (!otpDataStr) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    const otpData: OTPData = JSON.parse(otpDataStr);

    if (otpData.purpose !== 'password-reset') {
      throw new AppError('Invalid OTP purpose', 400, 'INVALID_OTP');
    }

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

    // Find user
    const user = await this.repository.findByEmail(otpData.email);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Update password
    await this.repository.setPassword(user._id.toString(), newPassword);

    // Invalidate all refresh tokens for security
    await this.repository.invalidateAllRefreshTokens(user._id.toString());
  }
}

