import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config/env';
import { OrderRepository } from '../modules/orders/repository';
import { ProductRepository } from '../modules/products/repository';
import { emitToUser } from '../socket';

const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();

const bullmqConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const orderExpiryQueue = new Queue('order-expiry', {
  connection: bullmqConnection,
});

export const settlementQueue = new Queue('settlement', {
  connection: bullmqConnection,
});

export const initializeWorkers = (): void => {
  new Worker(
    'order-expiry',
    async (job) => {
      const { orderId, customerId } = job.data;
      const order = await orderRepository.findById(orderId);

      if (order && order.status === 'PLACED') {
        for (const item of order.items) {
          await productRepository.updateStock(item.productId.toString(), item.qty);
        }

        await orderRepository.update(orderId, {
          status: 'CANCELLED',
        });

        await orderRepository.addLog(orderId, {
          actor: null,
          type: 'AUTO_CANCELLED',
          message: 'Order auto-cancelled due to merchant timeout',
        });

        await emitToUser(customerId.toString(), 'customer', 'order:cancelled', {
          orderId,
          reason: 'Merchant did not respond in time',
        });
      }
    },
    { connection: bullmqConnection }
  );

  new Worker(
    'settlement',
    async (job) => {
      console.log('Running daily settlement job...');
    },
    { connection: bullmqConnection }
  );
};

export const scheduleOrderExpiry = async (orderId: string, customerId: string): Promise<void> => {
  await orderExpiryQueue.add(
    'expire-order',
    { orderId, customerId },
    {
      delay: config.orderMerchantTtlMinutes * 60 * 1000,
    }
  );
};

