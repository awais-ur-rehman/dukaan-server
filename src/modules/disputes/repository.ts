import { Dispute, type IDispute } from '../../models/Dispute';
import mongoose from 'mongoose';

export class DisputeRepository {
  async create(data: Partial<IDispute>): Promise<IDispute> {
    const dispute = new Dispute(data);
    return dispute.save();
  }

  async findById(id: string): Promise<IDispute | null> {
    return Dispute.findById(id)
      .populate('orderId', 'total status items')
      .populate('customerId', 'name email')
      .populate('merchantId', 'names')
      .populate('adminId', 'name email')
      .populate('comments.userId', 'name email role')
      .exec();
  }

  async findByCustomerId(customerId: string, page: number, limit: number): Promise<{ disputes: IDispute[]; total: number }> {
    const query = { customerId: new mongoose.Types.ObjectId(customerId) };
    const total = await Dispute.countDocuments(query);
    const disputes = await Dispute.find(query)
      .populate('orderId', 'total status')
      .populate('merchantId', 'names')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { disputes, total };
  }

  async update(id: string, data: Partial<IDispute>): Promise<IDispute | null> {
    return Dispute.findByIdAndUpdate(id, data, { new: true })
      .populate('comments.userId', 'name email role')
      .exec();
  }

  async addComment(id: string, comment: { userId: string; role: string; message: string }): Promise<void> {
    await Dispute.findByIdAndUpdate(id, {
      $push: {
        comments: {
          ...comment,
          createdAt: new Date(),
        },
      },
    }).exec();
  }
}

