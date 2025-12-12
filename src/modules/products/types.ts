import { type IProduct } from '../../models/Product';

export interface ProductResponse extends Omit<IProduct, 'merchantId'> {
  merchantId: string;
}

export interface PaginatedProducts {
  items: ProductResponse[];
  total: number;
  page: number;
  limit: number;
}

