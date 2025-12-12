import { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid token', 401, 'UNAUTHORIZED'));
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
};

