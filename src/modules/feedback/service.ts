import { FeedbackRepository } from './repository';
import { OrderRepository } from '../orders/repository';
import { type CreateFeedbackRequest } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type IFeedback } from '../../models/Feedback';

export class FeedbackService {
  private repository: FeedbackRepository;
  private orderRepository: OrderRepository;

  constructor() {
    this.repository = new FeedbackRepository();
    this.orderRepository = new OrderRepository();
  }

  async create(customerId: string, data: CreateFeedbackRequest) {
    const order = await this.orderRepository.findById(data.orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.customerId.toString() !== customerId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    if (order.status !== 'DELIVERED') {
      throw new AppError('Order must be delivered before providing feedback', 400, 'INVALID_ORDER_STATE');
    }

    const existing = await this.repository.findByOrderId(data.orderId);
    if (existing) {
      throw new AppError('Feedback already exists for this order', 409, 'FEEDBACK_EXISTS');
    }

    const feedback = await this.repository.create({
      orderId: data.orderId,
      customerId,
      merchantId: order.merchantId.toString(),
      rating: data.rating,
      comment: data.comment,
      images: data.images,
    });

    return this.toResponse(feedback);
  }

  async getByCustomerId(customerId: string, page: number = 1, limit: number = 20) {
    const { feedbacks, total } = await this.repository.findByCustomerId(customerId, page, limit);
    return {
      items: feedbacks.map((f) => this.toResponse(f)),
      total,
      page,
      limit,
    };
  }

  private toResponse(feedback: IFeedback) {
    const order = (feedback.orderId as any)?.toObject?.() || feedback.orderId;
    const merchant = (feedback.merchantId as any)?.toObject?.() || feedback.merchantId;
    return {
      _id: feedback._id.toString(),
      orderId: feedback.orderId.toString(),
      merchantId: feedback.merchantId.toString(),
      merchantName: merchant?.names?.en,
      rating: feedback.rating,
      comment: feedback.comment,
      images: feedback.images,
      createdAt: feedback.createdAt,
    };
  }
}

