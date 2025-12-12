import { DisputeRepository } from './repository';
import { OrderRepository } from '../orders/repository';
import { type CreateDisputeRequest, type AddCommentRequest } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type IDispute } from '../../models/Dispute';

export class DisputeService {
  private repository: DisputeRepository;
  private orderRepository: OrderRepository;

  constructor() {
    this.repository = new DisputeRepository();
    this.orderRepository = new OrderRepository();
  }

  async create(customerId: string, data: CreateDisputeRequest) {
    const order = await this.orderRepository.findById(data.orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.customerId.toString() !== customerId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    if (order.status !== 'DELIVERED' && order.status !== 'FAILED') {
      throw new AppError('Dispute can only be opened for delivered or failed orders', 400, 'INVALID_ORDER_STATE');
    }

    const existing = await this.repository.findById(data.orderId);
    if (existing) {
      throw new AppError('Dispute already exists for this order', 409, 'DISPUTE_EXISTS');
    }

    const dispute = await this.repository.create({
      orderId: data.orderId,
      customerId,
      merchantId: order.merchantId.toString(),
      type: data.type,
      reason: data.reason,
      status: 'OPEN',
      comments: [
        {
          userId: customerId,
          role: 'customer',
          message: data.reason,
          createdAt: new Date(),
        },
      ],
    });

    await this.orderRepository.update(data.orderId, {
      dispute: {
        openedBy: customerId,
        reason: data.reason,
        status: 'OPEN',
      },
    });

    return this.toResponse(dispute);
  }

  async getByCustomerId(customerId: string, page: number = 1, limit: number = 20) {
    const { disputes, total } = await this.repository.findByCustomerId(customerId, page, limit);
    return {
      items: disputes.map((d) => this.toResponse(d)),
      total,
      page,
      limit,
    };
  }

  async getById(id: string, customerId: string) {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');
    }

    if (dispute.customerId.toString() !== customerId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    return this.toResponse(dispute);
  }

  async addComment(id: string, customerId: string, data: AddCommentRequest) {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');
    }

    if (dispute.customerId.toString() !== customerId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    await this.repository.addComment(id, {
      userId: customerId,
      role: 'customer',
      message: data.message,
    });

    const updated = await this.repository.findById(id);
    if (!updated) {
      throw new AppError('Failed to add comment', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  private toResponse(dispute: IDispute) {
    const order = (dispute.orderId as any)?.toObject?.() || dispute.orderId;
    const merchant = (dispute.merchantId as any)?.toObject?.() || dispute.merchantId;
    return {
      _id: dispute._id.toString(),
      orderId: dispute.orderId.toString(),
      merchantId: dispute.merchantId.toString(),
      merchantName: merchant?.names?.en,
      type: dispute.type,
      reason: dispute.reason,
      status: dispute.status,
      comments: dispute.comments.map((c) => ({
        userId: c.userId.toString(),
        role: c.role,
        message: c.message,
        createdAt: c.createdAt,
      })),
      resolution: dispute.resolution,
      resolvedAt: dispute.resolvedAt,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  }
}

