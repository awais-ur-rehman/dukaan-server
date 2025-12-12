import { FavoriteRepository } from './repository';
import { type AddFavoriteRequest } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type IFavorite } from '../../models/Favorite';

export class FavoriteService {
  private repository: FavoriteRepository;

  constructor() {
    this.repository = new FavoriteRepository();
  }

  async addFavorite(customerId: string, data: AddFavoriteRequest) {
    if (data.type === 'shop' && !data.shopId) {
      throw new AppError('Shop ID is required for shop favorite', 400, 'INVALID_REQUEST');
    }
    if (data.type === 'product' && !data.productId) {
      throw new AppError('Product ID is required for product favorite', 400, 'INVALID_REQUEST');
    }

    const existing = await this.repository.findOne(
      customerId,
      data.type,
      data.shopId,
      data.productId
    );

    if (existing) {
      throw new AppError('Already in favorites', 409, 'ALREADY_FAVORITE');
    }

    const favorite = await this.repository.create({
      customerId,
      type: data.type,
      shopId: data.shopId,
      productId: data.productId,
    });

    return this.toResponse(favorite);
  }

  async getFavorites(customerId: string, type?: 'shop' | 'product') {
    const favorites = await this.repository.findByCustomerId(customerId, type);
    return favorites.map((f) => this.toResponse(f));
  }

  async removeFavorite(customerId: string, favoriteId: string) {
    const deleted = await this.repository.delete(favoriteId, customerId);
    if (!deleted) {
      throw new AppError('Favorite not found', 404, 'FAVORITE_NOT_FOUND');
    }
  }

  private toResponse(favorite: IFavorite) {
    const shop = (favorite.shopId as any)?.toObject?.() || favorite.shopId;
    const product = (favorite.productId as any)?.toObject?.() || favorite.productId;

    return {
      _id: favorite._id.toString(),
      type: favorite.type,
      shopId: favorite.shopId?.toString(),
      shopName: shop?.names?.en,
      productId: favorite.productId?.toString(),
      productName: product?.names?.en,
      createdAt: favorite.createdAt,
    };
  }
}

