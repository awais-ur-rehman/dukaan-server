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
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

