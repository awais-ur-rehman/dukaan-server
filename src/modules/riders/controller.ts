import { Request, Response, NextFunction } from 'express';
import { RiderService } from './service';
import { createRiderDto, updateRiderDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class RiderController {
  private service: RiderService;

  constructor() {
    this.service = new RiderService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mid } = req.params;
      const validated = createRiderDto.parse(req.body);
      const result = await this.service.create(mid, validated);

      res.status(201).json({
        success: true,
        message: 'Rider created successfully',
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

  findByMerchantId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mid } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.service.findByMerchantId(mid, page, limit);

      res.status(200).json({
        success: true,
        message: 'Riders fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = updateRiderDto.parse(req.body);
      const result = await this.service.update(id, validated);

      res.status(200).json({
        success: true,
        message: 'Rider updated successfully',
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

