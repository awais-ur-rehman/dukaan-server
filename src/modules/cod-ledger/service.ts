import { CODLedgerRepository } from './repository';
import { AppError } from '../../middleware/errorHandler';

export class CODLedgerService {
  private repository: CODLedgerRepository;

  constructor() {
    this.repository = new CODLedgerRepository();
  }

  async findByMerchantId(
    merchantId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const { ledgers, total } = await this.repository.findByMerchantId(
      merchantId,
      { status },
      page,
      limit
    );

    const pendingTotal = await this.repository.getPendingTotal(merchantId);

    return {
      items: ledgers,
      total,
      page,
      limit,
      pendingTotal,
    };
  }

  async createSettlement(merchantId: string, ledgerIds: string[]) {
    await this.repository.markSettled(merchantId, ledgerIds);
    return { success: true, message: 'Settlement created' };
  }
}

