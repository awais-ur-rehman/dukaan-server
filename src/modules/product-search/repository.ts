import { Product, type IProduct } from '../../models/Product';
import { Merchant } from '../../models/Merchant';
import mongoose from 'mongoose';

export class ProductSearchRepository {
  async search(
    query: string,
    filters: {
      lat?: number;
      lng?: number;
      radius?: number;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
    },
    page: number,
    limit: number
  ): Promise<{ products: IProduct[]; total: number }> {
    const searchQuery: any = {
      active: true,
      $text: { $search: query },
    };

    if (filters.category) {
      searchQuery.category = filters.category;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      searchQuery.price = {};
      if (filters.minPrice !== undefined) {
        searchQuery.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        searchQuery.price.$lte = filters.maxPrice;
      }
    }

    let products = await Product.find(searchQuery)
      .populate('merchantId', 'names isApproved geo deliveryRadiusMeters')
      .sort({ score: { $meta: 'textScore' } })
      .exec();

    if (filters.lat && filters.lng && filters.radius) {
      const nearbyMerchants = await Merchant.find({
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [filters.lng, filters.lat],
            },
            $maxDistance: filters.radius,
          },
        },
        isApproved: true,
      }).select('_id').exec();

      const merchantIds = nearbyMerchants.map((m) => m._id);
      products = products.filter((p) => merchantIds.includes(p.merchantId));
    }

    const total = products.length;
    const paginatedProducts = products.slice((page - 1) * limit, page * limit);

    return { products: paginatedProducts, total };
  }
}

