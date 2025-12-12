import { Request, Response, NextFunction } from 'express';
import { ProductSearchService } from './service';
import { searchProductsDto } from './dto';
import { AppError } from '../../middleware/errorHandler';

export class ProductSearchController {
  private service: ProductSearchService;

  constructor() {
    this.service = new ProductSearchService();
  }

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = searchProductsDto.parse(req.query);
      const result = await this.service.search(validated);

      res.status(200).json({
        success: true,
        message: 'Products found',
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

