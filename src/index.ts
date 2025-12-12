import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './utils/rateLimit';
import { initializeSocket } from './socket';
import { initializeWorkers } from './jobs';

import authRoutes from './modules/auth/routes';
import merchantRoutes from './modules/merchants/routes';
import productRoutes from './modules/products/routes';
import riderRoutes from './modules/riders/routes';
import orderRoutes from './modules/orders/routes';
import codLedgerRoutes from './modules/cod-ledger/routes';
import notificationRoutes from './modules/notifications/routes';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(rateLimitMiddleware);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', merchantRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', riderRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', codLedgerRoutes);
app.use('/api/v1', notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await connectRedis();
    await initializeSocket(httpServer);
    initializeWorkers();

    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    process.exit(0);
  });
});

