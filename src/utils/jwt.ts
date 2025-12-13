import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { type UserRole } from '../models/User';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: `${config.jwtAccessTtlMin}m`,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: `${config.jwtRefreshTtlDays}d`,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token signature');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not active yet');
    }
    throw new Error('Invalid token');
  }
};

