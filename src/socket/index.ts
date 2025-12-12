import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient } from '../config/redis';
import { verifyToken, type TokenPayload } from '../utils/jwt';
import { NotificationService } from '../modules/notifications/service';

const notificationService = new NotificationService();

export const initializeSocket = async (httpServer: HTTPServer): Promise<SocketIOServer> => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  try {
    const { createClient } = await import('redis');
    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient as any, subClient as any));
  } catch (error) {
    console.warn('Redis adapter not available, using in-memory adapter:', error);
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const payload = verifyToken(token as string);
      (socket as any).user = payload;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user as TokenPayload;

    const userRoom = `${user.role}:${user.userId}`;
    socket.join(userRoom);

    const socketKey = `socket:user:${user.userId}`;
    redisClient.sAdd(socketKey, socket.id);

    if (user.role === 'merchant_owner') {
      const merchantKey = `merchant:owner:${user.userId}`;
      redisClient.get(merchantKey).then((merchantId) => {
        if (merchantId) {
          socket.join(`shop:${merchantId}`);
        }
      });
    }

    socket.on('disconnect', () => {
      redisClient.sRem(socketKey, socket.id);
    });
  });

  (global as any).io = io;

  return io;
};

export const emitToRoom = (room: string, event: string, payload: unknown): void => {
  const io = (global as any).io as SocketIOServer;
  if (io) {
    io.to(room).emit(event, payload);
  }
};

export const emitToUser = async (userId: string, role: string, event: string, payload: unknown): Promise<void> => {
  const room = `${role}:${userId}`;
  emitToRoom(room, event, payload);

  try {
    await notificationService.send({
      toUserId: userId,
      channels: ['fcm'],
      type: event,
      payload: payload as Record<string, unknown>,
    });
  } catch (error) {
    console.error('Failed to send fallback notification:', error);
  }
};

