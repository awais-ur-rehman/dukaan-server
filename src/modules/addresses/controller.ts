import { Request, Response, NextFunction } from 'express';
import { AddressService } from './service';
import { createAddressDto, updateAddressDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class AddressController {
  private service: AddressService;

  constructor() {
    this.service = new AddressService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = createAddressDto.parse(req.body);
      const result = await this.service.create(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Address created successfully',
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

  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.findByCustomerId(userId);

      res.status(200).json({
        success: true,
        message: 'Addresses fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = updateAddressDto.parse(req.body);
      const result = await this.service.update(id, userId, validated);

      res.status(200).json({
        success: true,
        message: 'Address updated successfully',
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

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      await this.service.delete(id, userId);

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  setDefault = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.setDefault(id, userId);

      res.status(200).json({
        success: true,
        message: 'Default address updated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

