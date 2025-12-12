import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './service';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class NotificationController {
  private service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { toUserId, channels, type, payload } = req.body;

      if (!toUserId || !channels || !type || !payload) {
        throw new AppError('Missing required fields', 400, 'INVALID_REQUEST');
      }

      await this.service.send({ toUserId, channels, type, payload });

      res.status(200).json({
        success: true,
        message: 'Notification sent',
      });
    } catch (error) {
      next(error);
    }
  };

  getByUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await this.service.getByUserId(userId, page, limit, unreadOnly);

      res.status(200).json({
        success: true,
        message: 'Notifications fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      await this.service.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      await this.service.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  };
}

