import { Response, NextFunction } from 'express';
import { CheckoutService } from './service';
import { checkoutDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class CheckoutController {
  private service: CheckoutService;

  constructor() {
    this.service = new CheckoutService();
  }

  checkout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = checkoutDto.parse(req.body);
      const result = await this.service.checkout(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
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

