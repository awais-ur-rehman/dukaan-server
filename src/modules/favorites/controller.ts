import { Request, Response, NextFunction } from 'express';
import { FavoriteService } from './service';
import { addFavoriteDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class FavoriteController {
  private service: FavoriteService;

  constructor() {
    this.service = new FavoriteService();
  }

  addFavorite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = addFavoriteDto.parse(req.body);
      const result = await this.service.addFavorite(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Added to favorites',
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

  getFavorites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const type = req.query.type as 'shop' | 'product' | undefined;
      const result = await this.service.getFavorites(userId, type);

      res.status(200).json({
        success: true,
        message: 'Favorites fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  removeFavorite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      await this.service.removeFavorite(userId, id);

      res.status(200).json({
        success: true,
        message: 'Removed from favorites',
      });
    } catch (error) {
      next(error);
    }
  };
}

