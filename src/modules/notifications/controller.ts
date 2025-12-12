import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './service';
import { AppError } from '../../middleware/errorHandler';

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
}

