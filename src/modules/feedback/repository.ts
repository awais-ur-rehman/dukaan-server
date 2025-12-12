import { Feedback, type IFeedback } from '../../models/Feedback';
import { Order } from '../../models/Order';
import mongoose from 'mongoose';

export class FeedbackRepository {
  async create(data: Partial<IFeedback>): Promise<IFeedback> {
    const feedback = new Feedback(data);
    return feedback.save();
  }

  async findByOrderId(orderId: string): Promise<IFeedback | null> {
    return Feedback.findOne({ orderId: new mongoose.Types.ObjectId(orderId) })
      .populate('customerId', 'name email')
      .exec();
  }

  async findByCustomerId(customerId: string, page: number, limit: number): Promise<{ feedbacks: IFeedback[]; total: number }> {
    const query = { customerId: new mongoose.Types.ObjectId(customerId) };
    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .populate('orderId', 'total status')
      .populate('merchantId', 'names')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { feedbacks, total };
  }

  async findByMerchantId(merchantId: string, page: number, limit: number): Promise<{ feedbacks: IFeedback[]; total: number }> {
    const query = { merchantId: new mongoose.Types.ObjectId(merchantId) };
    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .populate('orderId', 'total')
      .populate('customerId', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { feedbacks, total };
  }
}

