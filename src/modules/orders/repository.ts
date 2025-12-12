import { Order, type IOrder } from '../../models/Order';
import mongoose from 'mongoose';

export class OrderRepository {
  async create(data: Partial<IOrder>): Promise<IOrder> {
    const order = new Order(data);
    return order.save();
  }

  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id)
      .populate('merchantId', 'names deliveryCharge')
      .populate('customerId', 'email name')
      .populate('assignedRiderId', 'name phone')
      .exec();
  }

  async findByClientOrderId(clientOrderId: string): Promise<IOrder | null> {
    return Order.findOne({ clientOrderId }).exec();
  }

  async findByMerchantId(
    merchantId: string,
    filters: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number,
    limit: number
  ): Promise<{ orders: IOrder[]; total: number }> {
    const query: any = { merchantId: new mongoose.Types.ObjectId(merchantId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.createdAt.$lte = filters.dateTo;
      }
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { orders, total };
  }

  async findByCustomerId(
    customerId: string,
    filters: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number,
    limit: number
  ): Promise<{ orders: IOrder[]; total: number }> {
    const query: any = { customerId: new mongoose.Types.ObjectId(customerId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.createdAt.$lte = filters.dateTo;
      }
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { orders, total };
  }

  async findByRiderId(
    riderId: string,
    filters: {
      status?: string;
    },
    page: number,
    limit: number
  ): Promise<{ orders: IOrder[]; total: number }> {
    const query: any = { assignedRiderId: new mongoose.Types.ObjectId(riderId) };

    if (filters.status) {
      query.status = filters.status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { orders, total };
  }

  async update(id: string, data: Partial<IOrder>): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async addLog(id: string, log: { actor: string | null; type: string; message: string }): Promise<void> {
    await Order.findByIdAndUpdate(id, {
      $push: {
        logs: {
          ...log,
          at: new Date(),
        },
      },
    }).exec();
  }

  async findExpiredOrders(ttlMinutes: number): Promise<IOrder[]> {
    const ttlAgo = new Date(Date.now() - ttlMinutes * 60 * 1000);
    return Order.find({
      status: 'PLACED',
      createdAt: { $lt: ttlAgo },
    }).exec();
  }
}

