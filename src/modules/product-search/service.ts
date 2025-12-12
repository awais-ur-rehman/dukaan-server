import { ProductSearchRepository } from './repository';
import { type SearchProductsRequest } from './dto';
import { type IProduct } from '../../models/Product';

export class ProductSearchService {
  private repository: ProductSearchRepository;

  constructor() {
    this.repository = new ProductSearchRepository();
  }

  async search(query: SearchProductsRequest) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const { products, total } = await this.repository.search(
      query.q,
      {
        lat: query.lat,
        lng: query.lng,
        radius: query.radius || 5000,
        category: query.category,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
      },
      page,
      limit
    );

    return {
      items: products.map((p) => this.toResponse(p)),
      total,
      page,
      limit,
    };
  }

  private toResponse(product: IProduct) {
    const merchant = product.merchantId as any;
    return {
      _id: product._id.toString(),
      merchantId: product.merchantId.toString(),
      merchantName: merchant?.names?.en || 'Unknown',
      sku: product.sku,
      names: product.names,
      description: product.description,
      images: product.images,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      category: product.category,
      tags: product.tags,
    };
  }
}

