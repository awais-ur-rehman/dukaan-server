import { createClient } from 'redis';
import { config } from './env';

export const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    process.exit(1);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  await redisClient.quit();
  console.log('Redis disconnected');
};

