import { Product, type IProduct } from '../../models/Product';
import mongoose from 'mongoose';

export class ProductRepository {
  async create(data: Partial<IProduct>): Promise<IProduct> {
    const product = new Product(data);
    return product.save();
  }

  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).populate('merchantId', 'names isApproved').exec();
  }

  async findByMerchantId(
    merchantId: string,
    filters: {
      q?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
    },
    page: number,
    limit: number
  ): Promise<{ products: IProduct[]; total: number }> {
    const query: any = { merchantId: new mongoose.Types.ObjectId(merchantId), active: true };

    if (filters.q) {
      query.$text = { $search: filters.q };
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }

    if (filters.inStock) {
      query.stock = { $gt: 0 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(filters.q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .exec();

    return { products, total };
  }

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id).exec();
    return !!result;
  }

  async updateStock(id: string, quantity: number): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true }
    ).exec();
  }

  async findByIds(ids: string[]): Promise<IProduct[]> {
    return Product.find({
      _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
    }).exec();
  }

  async atomicStockDecrement(productId: string, quantity: number): Promise<IProduct | null> {
    return Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    ).exec();
  }
}

