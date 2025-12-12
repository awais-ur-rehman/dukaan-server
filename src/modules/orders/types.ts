import { type IOrder } from '../../models/Order';

export interface OrderResponse extends Omit<IOrder, 'merchantId' | 'customerId' | 'assignedRiderId'> {
  merchantId: string;
  customerId: string;
  assignedRiderId?: string;
}

export interface PaginatedOrders {
  items: OrderResponse[];
  total: number;
  page: number;
  limit: number;
}

