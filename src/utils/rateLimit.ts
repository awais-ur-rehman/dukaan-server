import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { config } from '../config/env';

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!config.rateLimit.enabled) {
    next();
    return;
  }

  const identifier = (req as any).user?.userId || req.ip;
  const windowStart = Math.floor(Date.now() / 1000 / config.rateLimit.windowSeconds);
  const key = `rate:${identifier}:${windowStart}`;

  try {
    const count = await redisClient.incr(key);
    await redisClient.expire(key, config.rateLimit.windowSeconds);

    if (count > config.rateLimit.maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    next();
  }
};

