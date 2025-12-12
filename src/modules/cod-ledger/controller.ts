import { Request, Response, NextFunction } from 'express';
import { CODLedgerService } from './service';
import { AppError } from '../../middleware/errorHandler';

export class CODLedgerController {
  private service: CODLedgerService;

  constructor() {
    this.service = new CODLedgerService();
  }

  findByMerchantId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mid } = req.params;
      const status = req.query.status as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.service.findByMerchantId(mid, status, page, limit);

      res.status(200).json({
        success: true,
        message: 'COD ledger fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  createSettlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mid } = req.params;
      const { ledgerIds } = req.body;

      if (!Array.isArray(ledgerIds) || ledgerIds.length === 0) {
        throw new AppError('Ledger IDs array is required', 400, 'INVALID_REQUEST');
      }

      const result = await this.service.createSettlement(mid, ledgerIds);

      res.status(200).json({
        success: true,
        message: 'Settlement created',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

