import { CODLedger, type ICODLedger } from '../../models/CODLedger';
import mongoose from 'mongoose';

export class CODLedgerRepository {
  async create(data: Partial<ICODLedger>): Promise<ICODLedger> {
    const ledger = new CODLedger(data);
    return ledger.save();
  }

  async findByMerchantId(
    merchantId: string,
    filters: {
      status?: string;
    },
    page: number,
    limit: number
  ): Promise<{ ledgers: ICODLedger[]; total: number }> {
    const query: any = { merchantId: new mongoose.Types.ObjectId(merchantId) };

    if (filters.status) {
      query.status = filters.status;
    }

    const total = await CODLedger.countDocuments(query);
    const ledgers = await CODLedger.find(query)
      .populate('orderId', 'total customerSnapshot')
      .populate('collectedByRiderId', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { ledgers, total };
  }

  async markCollected(orderId: string, riderId: string): Promise<void> {
    await CODLedger.findOneAndUpdate(
      { orderId: new mongoose.Types.ObjectId(orderId) },
      {
        status: 'COLLECTED',
        collectedByRiderId: new mongoose.Types.ObjectId(riderId),
        collectedAt: new Date(),
      }
    ).exec();
  }

  async markSettled(merchantId: string, ledgerIds: string[]): Promise<void> {
    await CODLedger.updateMany(
      {
        merchantId: new mongoose.Types.ObjectId(merchantId),
        _id: { $in: ledgerIds.map((id) => new mongoose.Types.ObjectId(id)) },
      },
      { status: 'SETTLED' }
    ).exec();
  }

  async getPendingTotal(merchantId: string): Promise<number> {
    const result = await CODLedger.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          status: { $in: ['PENDING', 'COLLECTED'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).exec();

    return result.length > 0 ? result[0].total : 0;
  }
}

