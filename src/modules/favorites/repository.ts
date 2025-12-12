import { Favorite, type IFavorite } from '../../models/Favorite';
import mongoose from 'mongoose';

export class FavoriteRepository {
  async create(data: Partial<IFavorite>): Promise<IFavorite> {
    const favorite = new Favorite(data);
    return favorite.save();
  }

  async findByCustomerId(customerId: string, type?: 'shop' | 'product'): Promise<IFavorite[]> {
    const query: any = { customerId: new mongoose.Types.ObjectId(customerId) };
    if (type) {
      query.type = type;
    }
    return Favorite.find(query)
      .populate('shopId', 'names deliveryCharge')
      .populate('productId', 'names price images')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(customerId: string, type: 'shop' | 'product', shopId?: string, productId?: string): Promise<IFavorite | null> {
    const query: any = {
      customerId: new mongoose.Types.ObjectId(customerId),
      type,
    };
    if (shopId) {
      query.shopId = new mongoose.Types.ObjectId(shopId);
    }
    if (productId) {
      query.productId = new mongoose.Types.ObjectId(productId);
    }
    return Favorite.findOne(query).exec();
  }

  async delete(id: string, customerId: string): Promise<boolean> {
    const result = await Favorite.findOneAndDelete({
      _id: id,
      customerId: new mongoose.Types.ObjectId(customerId),
    }).exec();
    return !!result;
  }
}

