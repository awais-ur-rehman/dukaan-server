import { Request, Response, NextFunction } from 'express';
import { CartService } from './service';
import { addToCartDto, updateCartItemDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class CartController {
  private service: CartService;

  constructor() {
    this.service = new CartService();
  }

  addToCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = addToCartDto.parse(req.body);
      const result = await this.service.addToCart(userId, validated);

      res.status(200).json({
        success: true,
        message: 'Item added to cart',
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

  getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const merchantId = req.query.merchantId as string | undefined;
      const result = await this.service.getCart(userId, merchantId);

      res.status(200).json({
        success: true,
        message: 'Cart fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { merchantId, productId } = req.params;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = updateCartItemDto.parse(req.body);
      const result = await this.service.updateCartItem(userId, merchantId, productId, validated);

      res.status(200).json({
        success: true,
        message: 'Cart item updated',
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

  removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { merchantId, productId } = req.params;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.removeFromCart(userId, merchantId, productId);

      res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { merchantId } = req.params;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      await this.service.clearCart(userId, merchantId);

      res.status(200).json({
        success: true,
        message: 'Cart cleared',
      });
    } catch (error) {
      next(error);
    }
  };
}

