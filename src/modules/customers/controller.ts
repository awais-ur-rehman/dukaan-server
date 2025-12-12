import { Response, NextFunction } from 'express';
import { CustomerService } from './service';
import { updateProfileDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class CustomerController {
  private service: CustomerService;

  constructor() {
    this.service = new CustomerService();
  }

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.getProfile(userId);

      res.status(200).json({
        success: true,
        message: 'Profile fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = updateProfileDto.parse(req.body);
      const result = await this.service.updateProfile(userId, validated);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
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

