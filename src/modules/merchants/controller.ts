import { Request, Response, NextFunction } from 'express';
import { MerchantService } from './service';
import { createMerchantDto, updateMerchantDto, verifyMerchantDto, getMerchantsQueryDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class MerchantController {
  private service: MerchantService;

  constructor() {
    this.service = new MerchantService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createMerchantDto.parse(req.body);
      const result = await this.service.create(validated);

      res.status(201).json({
        success: true,
        message: 'Merchant created successfully',
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

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.findById(id);

      res.status(200).json({
        success: true,
        message: 'Merchant fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = updateMerchantDto.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.update(id, validated, userId);

      res.status(200).json({
        success: true,
        message: 'Merchant updated successfully',
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

  findNearby = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = getMerchantsQueryDto.parse(req.query);
      const result = await this.service.findNearby(validated);

      res.status(200).json({
        success: true,
        message: 'Merchants fetched',
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

  findPending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.service.findPending(page, limit);

      res.status(200).json({
        success: true,
        message: 'Pending merchants fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  verify = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = verifyMerchantDto.parse(req.body);
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.verify(id, validated, adminId);

      res.status(200).json({
        success: true,
        message: `Merchant ${validated.approved ? 'approved' : 'rejected'}`,
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

