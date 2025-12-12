import { redisClient } from '../config/redis';
import { config } from '../config/env';

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const setCache = async (
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> => {
  try {
    const ttl = ttlSeconds || config.cacheDefaultTtlSeconds;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
};

