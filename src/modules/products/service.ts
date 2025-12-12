import { ProductRepository } from './repository';
import { type CreateProductRequest, type UpdateProductRequest, type GetProductsQuery } from './dto';
import { type ProductResponse, type PaginatedProducts } from './types';
import { deleteCachePattern, setCache, getCache } from '../../utils/cache';
import { AppError } from '../../middleware/errorHandler';
import { type IProduct } from '../../models/Product';

export class ProductService {
  private repository: ProductRepository;

  constructor() {
    this.repository = new ProductRepository();
  }

  async create(data: CreateProductRequest, userId: string): Promise<ProductResponse> {
    const product = await this.repository.create({
      ...data,
      merchantId: data.merchantId,
    });

    await deleteCachePattern(`merchant:products:${data.merchantId}:*`);
    await deleteCachePattern(`merchant:meta:${data.merchantId}`);

    return this.toResponse(product);
  }

  async findById(id: string): Promise<ProductResponse> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    return this.toResponse(product);
  }

  async findByMerchantId(merchantId: string, query: GetProductsQuery): Promise<PaginatedProducts> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const cacheKey = `merchant:products:${merchantId}:page:${page}:${query.q || ''}:${query.category || ''}`;
    const cached = await getCache<PaginatedProducts>(cacheKey);
    if (cached) {
      return cached;
    }

    const { products, total } = await this.repository.findByMerchantId(
      merchantId,
      {
        q: query.q,
        category: query.category,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStock: query.inStock,
      },
      page,
      limit
    );

    const result: PaginatedProducts = {
      items: products.map((p) => this.toResponse(p)),
      total,
      page,
      limit,
    };

    await setCache(cacheKey, result, 60);

    return result;
  }

  async update(id: string, data: UpdateProductRequest, userId: string): Promise<ProductResponse> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new AppError('Failed to update product', 500, 'UPDATE_FAILED');
    }

    await deleteCachePattern(`merchant:products:${product.merchantId.toString()}:*`);
    await deleteCachePattern(`merchant:meta:${product.merchantId.toString()}`);

    return this.toResponse(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete product', 500, 'DELETE_FAILED');
    }

    await deleteCachePattern(`merchant:products:${product.merchantId.toString()}:*`);
    await deleteCachePattern(`merchant:meta:${product.merchantId.toString()}`);
  }

  async atomicStockDecrement(productId: string, quantity: number): Promise<IProduct> {
    const product = await this.repository.atomicStockDecrement(productId, quantity);
    if (!product) {
      throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }
    return product;
  }

  private toResponse(product: IProduct): ProductResponse {
    return {
      ...product.toObject(),
      merchantId: product.merchantId.toString(),
    } as ProductResponse;
  }
}

