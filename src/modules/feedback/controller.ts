import { Request, Response, NextFunction } from 'express';
import { FeedbackService } from './service';
import { createFeedbackDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class FeedbackController {
  private service: FeedbackService;

  constructor() {
    this.service = new FeedbackService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = createFeedbackDto.parse(req.body);
      const result = await this.service.create(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
      } else {
        next(error);
      }
    }
  };

  getByCustomer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.service.getByCustomerId(userId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Feedback fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

