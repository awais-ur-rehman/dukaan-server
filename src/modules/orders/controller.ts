import { Request, Response, NextFunction } from 'express';
import { OrderService } from './service';
import { createOrderDto, merchantAcceptDto, customerConfirmDto, assignRiderDto, riderUpdateDto, getOrdersQueryDto } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class OrderController {
  private service: OrderService;

  constructor() {
    this.service = new OrderService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mid } = req.params;
      const validated = createOrderDto.parse({ ...req.body, merchantId: mid });
      const userId = req.user?.userId;
      const clientRequestId = req.headers['x-client-request-id'] as string;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.create(validated, userId, clientRequestId);

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

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.findById(id);

      res.status(200).json({
        success: true,
        message: 'Order fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  merchantAccept = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = merchantAcceptDto.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.merchantAccept(id, validated, userId);

      res.status(200).json({
        success: true,
        message: 'Order updated',
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

  customerConfirm = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = customerConfirmDto.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.customerConfirm(id, validated, userId);

      res.status(200).json({
        success: true,
        message: 'Order confirmed',
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

  assignRider = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = assignRiderDto.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.assignRider(id, validated, userId);

      res.status(200).json({
        success: true,
        message: 'Rider assigned',
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

  riderUpdate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = riderUpdateDto.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await this.service.riderUpdate(id, validated, userId);

      res.status(200).json({
        success: true,
        message: 'Order status updated',
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

  findByMerchantId = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mid } = req.params;
      const validated = getOrdersQueryDto.parse(req.query);
      const result = await this.service.findByMerchantId(mid, validated);

      res.status(200).json({
        success: true,
        message: 'Orders fetched',
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

  findByCustomerId = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = getOrdersQueryDto.parse(req.query);
      const result = await this.service.findByCustomerId(userId, validated);

      res.status(200).json({
        success: true,
        message: 'Orders fetched',
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

  findByRiderId = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const validated = getOrdersQueryDto.parse(req.query);
      const result = await this.service.findByRiderId(userId, validated);

      res.status(200).json({
        success: true,
        message: 'Orders fetched',
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

