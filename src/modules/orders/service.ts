import { OrderRepository } from './repository';
import { ProductRepository } from '../products/repository';
import { MerchantRepository } from '../merchants/repository';
import { CODLedgerRepository } from '../cod-ledger/repository';
import { type CreateOrderRequest, type MerchantAcceptRequest, type CustomerConfirmRequest, type AssignRiderRequest, type RiderUpdateRequest, type GetOrdersQuery } from './dto';
import { type OrderResponse, type PaginatedOrders } from './types';
import { AppError } from '../../middleware/errorHandler';
import { type IOrder, type OrderStatus } from '../../models/Order';
import { redisClient } from '../../config/redis';
import { emitToRoom, emitToUser } from '../../socket';
import mongoose from 'mongoose';

export class OrderService {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;
  private merchantRepository: MerchantRepository;
  private codLedgerRepository: CODLedgerRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.merchantRepository = new MerchantRepository();
    this.codLedgerRepository = new CODLedgerRepository();
  }

  async create(data: CreateOrderRequest, userId: string, clientRequestId?: string): Promise<OrderResponse> {
    if (clientRequestId) {
      const existing = await redisClient.get(`idempotency:${clientRequestId}`);
      if (existing) {
        const orderId = JSON.parse(existing);
        const order = await this.orderRepository.findById(orderId);
        if (order) {
          return this.toResponse(order);
        }
      }
    }

    const merchant = await this.merchantRepository.findById(data.merchantId);
    if (!merchant || !merchant.isApproved) {
      throw new AppError('Merchant not found or not approved', 404, 'MERCHANT_NOT_FOUND');
    }

    const items = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = await this.productRepository.atomicStockDecrement(item.productId, item.qty);
      if (!product) {
        throw new AppError(`Insufficient stock for product ${item.productId}`, 400, 'INSUFFICIENT_STOCK');
      }

      const itemSubtotal = product.price * item.qty;
      subtotal += itemSubtotal;

      items.push({
        productId: product._id,
        name: product.names.en,
        price: product.price,
        qty: item.qty,
        unit: product.unit,
        subtotal: itemSubtotal,
      });
    }

    const deliveryCharge = merchant.deliveryCharge;
    const total = subtotal + deliveryCharge;

    const order = await this.orderRepository.create({
      clientOrderId: data.clientOrderId || clientRequestId,
      merchantId: data.merchantId,
      customerId: data.customerId,
      customerSnapshot: data.customerSnapshot,
      items,
      subtotal,
      deliveryCharge,
      total,
      payment: {
        method: data.paymentMethod,
        status: 'PENDING',
      },
      status: 'PLACED',
      deliverySlot: data.deliverySlot,
      logs: [
        {
          actor: new mongoose.Types.ObjectId(userId),
          type: 'ORDER_PLACED',
          message: 'Order placed by customer',
          at: new Date(),
        },
      ],
    });

    if (data.paymentMethod === 'COD' || data.paymentMethod === 'DROP_AT_DOOR') {
      await this.codLedgerRepository.create({
        merchantId: data.merchantId,
        orderId: order._id.toString(),
        amount: total,
        status: 'PENDING',
      });
    }

    if (clientRequestId) {
      await redisClient.setEx(`idempotency:${clientRequestId}`, 3600, JSON.stringify(order._id.toString()));
    }

    emitToRoom(`shop:${data.merchantId}`, 'order:new', {
      orderId: order._id.toString(),
      customerId: data.customerId,
      items: order.items,
      subtotal: order.subtotal,
      deliveryCharges: order.deliveryCharge,
      total: order.total,
    });

    return this.toResponse(order);
  }

  async merchantAccept(orderId: string, data: MerchantAcceptRequest, userId: string): Promise<OrderResponse> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status !== 'PLACED') {
      throw new AppError('Order cannot be modified in current state', 400, 'INVALID_ORDER_STATE');
    }

    if (data.accepted) {
      if (data.unavailableItems && data.unavailableItems.length > 0) {
        let newSubtotal = order.subtotal;
        const updatedItems = order.items.filter((item) => {
          const isUnavailable = data.unavailableItems?.includes(item.productId.toString());
          if (isUnavailable) {
            newSubtotal -= item.subtotal;
            this.productRepository.updateStock(item.productId.toString(), item.qty);
          }
          return !isUnavailable;
        });

        const newTotal = newSubtotal + order.deliveryCharge;

        await this.orderRepository.update(orderId, {
          items: updatedItems,
          subtotal: newSubtotal,
          total: newTotal,
          status: 'AWAITING_CUSTOMER_CONFIRM',
        });

        await this.orderRepository.addLog(orderId, {
          actor: userId,
          type: 'MERCHANT_REVIEW',
          message: `Merchant reviewed order. ${data.unavailableItems.length} items unavailable.`,
        });

        await emitToUser(order.customerId.toString(), 'customer', 'order:confirm-required', {
          orderId: order._id.toString(),
          updatedItems: updatedItems,
          newTotal,
        });
      } else {
        await this.orderRepository.update(orderId, {
          status: 'MERCHANT_ACCEPTED',
        });

        await this.orderRepository.addLog(orderId, {
          actor: userId,
          type: 'MERCHANT_ACCEPTED',
          message: 'Merchant accepted order',
        });

        await emitToUser(order.customerId.toString(), 'customer', 'order:accepted', {
          orderId: order._id.toString(),
        });
      }
    } else {
      for (const item of order.items) {
        await this.productRepository.updateStock(item.productId.toString(), item.qty);
      }

      await this.orderRepository.update(orderId, {
        status: 'MERCHANT_REJECTED',
      });

      await this.orderRepository.addLog(orderId, {
        actor: userId,
        type: 'MERCHANT_REJECTED',
        message: data.notes || 'Order rejected by merchant',
      });

      await emitToUser(order.customerId.toString(), 'customer', 'order:rejected', {
        orderId: order._id.toString(),
        reason: data.notes || 'Order rejected by merchant',
      });
    }

    const updated = await this.orderRepository.findById(orderId);
    if (!updated) {
      throw new AppError('Failed to update order', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  async customerConfirm(orderId: string, data: CustomerConfirmRequest, userId: string): Promise<OrderResponse> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status !== 'AWAITING_CUSTOMER_CONFIRM') {
      throw new AppError('Order not awaiting customer confirmation', 400, 'INVALID_ORDER_STATE');
    }

    if (data.confirmed) {
      await this.orderRepository.update(orderId, {
        status: 'MERCHANT_ACCEPTED',
      });

      await this.orderRepository.addLog(orderId, {
        actor: userId,
        type: 'CUSTOMER_CONFIRMED',
        message: 'Customer confirmed updated order',
      });
    } else {
      for (const item of order.items) {
        await this.productRepository.updateStock(item.productId.toString(), item.qty);
      }

      await this.orderRepository.update(orderId, {
        status: 'CANCELLED',
      });

      await this.orderRepository.addLog(orderId, {
        actor: userId,
        type: 'CUSTOMER_CANCELLED',
        message: 'Customer cancelled order after review',
      });
    }

    const updated = await this.orderRepository.findById(orderId);
    if (!updated) {
      throw new AppError('Failed to update order', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  async assignRider(orderId: string, data: AssignRiderRequest, userId: string): Promise<OrderResponse> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status !== 'MERCHANT_ACCEPTED') {
      throw new AppError('Order must be accepted by merchant first', 400, 'INVALID_ORDER_STATE');
    }

    await this.orderRepository.update(orderId, {
      assignedRiderId: data.riderId,
      status: 'ASSIGNED',
    });

    await this.orderRepository.addLog(orderId, {
      actor: userId,
      type: 'RIDER_ASSIGNED',
      message: `Rider assigned: ${data.riderId}`,
    });

    await emitToUser(data.riderId, 'rider', 'rider:assigned', {
      orderId: order._id.toString(),
      shopId: order.merchantId.toString(),
      pickupLocation: merchant.shopAddress.text.en,
      dropoffLocation: order.customerSnapshot.addressText,
    });

    const updated = await this.orderRepository.findById(orderId);
    if (!updated) {
      throw new AppError('Failed to update order', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  async riderUpdate(orderId: string, data: RiderUpdateRequest, userId: string): Promise<OrderResponse> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const statusMap: Record<string, OrderStatus> = {
      PICKED_UP: 'PICKED_UP',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      FAILED: 'FAILED',
    };

    const updateData: any = {
      status: statusMap[data.status],
    };

    if (data.status === 'DELIVERED') {
      updateData.pod = {
        imageUrl: data.podImageUrl,
        otp: data.otpProvided,
        deliveredAt: new Date(),
        note: data.note,
      };

      if (order.payment.method !== 'COD' && order.payment.method !== 'DROP_AT_DOOR') {
        updateData['payment.status'] = 'PAID';
      } else {
        await this.codLedgerRepository.markCollected(orderId, userId);
      }
    }

    await this.orderRepository.update(orderId, updateData);

    await this.orderRepository.addLog(orderId, {
      actor: userId,
      type: `RIDER_${data.status}`,
      message: `Order status updated to ${data.status}`,
    });

    await emitToUser(order.customerId.toString(), 'customer', 'order:status', {
      orderId: order._id.toString(),
      status: updateData.status,
    });

    emitToRoom(`shop:${order.merchantId.toString()}`, 'order:status', {
      orderId: order._id.toString(),
      status: updateData.status,
    });

    if (data.status === 'OUT_FOR_DELIVERY') {
      await emitToUser(order.customerId.toString(), 'customer', 'delivery:started', {
        orderId: order._id.toString(),
      });
    }

    if (data.status === 'DELIVERED') {
      await emitToUser(order.customerId.toString(), 'customer', 'delivery:completed', {
        orderId: order._id.toString(),
        deliveredAt: new Date(),
        proofImage: data.podImageUrl,
      });
    }

    const updated = await this.orderRepository.findById(orderId);
    if (!updated) {
      throw new AppError('Failed to update order', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  async findByMerchantId(merchantId: string, query: GetOrdersQuery): Promise<PaginatedOrders> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

    const { orders, total } = await this.orderRepository.findByMerchantId(
      merchantId,
      {
        status: query.status,
        dateFrom,
        dateTo,
      },
      page,
      limit
    );

    return {
      items: orders.map((o) => this.toResponse(o)),
      total,
      page,
      limit,
    };
  }

  async findByCustomerId(customerId: string, query: GetOrdersQuery): Promise<PaginatedOrders> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

    const { orders, total } = await this.orderRepository.findByCustomerId(
      customerId,
      {
        status: query.status,
        dateFrom,
        dateTo,
      },
      page,
      limit
    );

    return {
      items: orders.map((o) => this.toResponse(o)),
      total,
      page,
      limit,
    };
  }

  async findByRiderId(riderId: string, query: GetOrdersQuery): Promise<PaginatedOrders> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const { orders, total } = await this.orderRepository.findByRiderId(
      riderId,
      {
        status: query.status,
      },
      page,
      limit
    );

    return {
      items: orders.map((o) => this.toResponse(o)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<OrderResponse> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    return this.toResponse(order);
  }

  private toResponse(order: IOrder): OrderResponse {
    return {
      ...order.toObject(),
      merchantId: order.merchantId.toString(),
      customerId: order.customerId.toString(),
      assignedRiderId: order.assignedRiderId?.toString(),
    } as OrderResponse;
  }
}

