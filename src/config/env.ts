import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/dukaan',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'changeme',
  jwtAccessTtlMin: parseInt(process.env.JWT_ACCESS_TTL_MIN || '15', 10),
  jwtRefreshTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS || '30', 10),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@dukaan.com',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  fcmServerKey: process.env.FCM_SERVER_KEY || '',
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PER_WINDOW || '30', 10),
  },
  orderMerchantTtlMinutes: parseInt(process.env.ORDER_MERCHANT_TTL_MINUTES || '10', 10),
  settlementDailyAt: process.env.SETTLEMENT_DAILY_AT || '02:00',
  cacheDefaultTtlSeconds: parseInt(process.env.CACHE_DEFAULT_TTL_SECONDS || '60', 10),
  mapsProvider: process.env.MAPS_PROVIDER || 'LEAFLET',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS || '300', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    maxRequestsPerHour: parseInt(process.env.OTP_MAX_REQUESTS_PER_HOUR || '5', 10),
  },
};

