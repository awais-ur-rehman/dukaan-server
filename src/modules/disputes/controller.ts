import { Request, Response, NextFunction } from 'express';
import { DisputeService } from './service';
import { createDisputeDto, addCommentDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class DisputeController {
  private service: DisputeService;

  constructor() {
    this.service = new DisputeService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = createDisputeDto.parse(req.body);
      const result = await this.service.create(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Dispute created successfully',
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
        message: 'Disputes fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.getById(id, userId);

      res.status(200).json({
        success: true,
        message: 'Dispute fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = addCommentDto.parse(req.body);
      const result = await this.service.addComment(id, userId, validated);

      res.status(200).json({
        success: true,
        message: 'Comment added',
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
}

