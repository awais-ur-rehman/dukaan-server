import { Request, Response, NextFunction } from 'express';
import { ProductService } from './service';
import { createProductDto, updateProductDto, getProductsQueryDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class ProductController {
  private service: ProductService;

  constructor() {
    this.service = new ProductService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mid } = req.params;
      const validated = createProductDto.parse({ ...req.body, merchantId: mid });
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.create(validated, userId);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
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
        message: 'Product fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  findByMerchantId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mid } = req.params;
      const validated = getProductsQueryDto.parse(req.query);
      const result = await this.service.findByMerchantId(mid, validated);

      res.status(200).json({
        success: true,
        message: 'Products fetched',
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

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = updateProductDto.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.update(id, validated, userId);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
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
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

