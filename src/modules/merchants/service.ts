import { MerchantRepository } from './repository';
import { type CreateMerchantRequest, type UpdateMerchantRequest, type VerifyMerchantRequest, type GetMerchantsQuery } from './dto';
import { type MerchantResponse, type PaginatedMerchants } from './types';
import { deleteCachePattern, setCache, getCache } from '../../utils/cache';
import { AppError } from '../../middleware/errorHandler';
import { type IMerchant } from '../../models/Merchant';
import { User } from '../../models/User';
import mongoose from 'mongoose';

export class MerchantService {
  private repository: MerchantRepository;

  constructor() {
    this.repository = new MerchantRepository();
  }

  async create(data: CreateMerchantRequest & { ownerUserId: string }): Promise<MerchantResponse> {
    if (!data.ownerUserId) {
      throw new AppError('Owner user ID is required', 400, 'VALIDATION_ERROR');
    }

    const existingMerchant = await this.repository.findByOwnerId(data.ownerUserId);
    if (existingMerchant) {
      throw new AppError('Merchant already exists for this user', 409, 'MERCHANT_EXISTS');
    }

    const merchantData = {
      ...data,
      ownerUserId: new mongoose.Types.ObjectId(data.ownerUserId),
      geo: {
        type: 'Point' as const,
        coordinates: [data.geo.lng, data.geo.lat] as [number, number],
      },
      isApproved: false,
    };

    const merchant = await this.repository.create(merchantData);
    
    // Update user role to merchant_owner
    await User.findByIdAndUpdate(data.ownerUserId, {
      role: 'merchant_owner',
      profileCompleted: true,
    }).exec();
    
    return this.toResponse(merchant);
  }

  async findById(id: string): Promise<MerchantResponse> {
    const merchant = await this.repository.findById(id);
    if (!merchant) {
      throw new AppError('Merchant not found', 404, 'MERCHANT_NOT_FOUND');
    }
    return this.toResponse(merchant);
  }

  async findByOwnerUserId(ownerUserId: string): Promise<MerchantResponse> {
    const merchant = await this.repository.findByOwnerId(ownerUserId);
    if (!merchant) {
      throw new AppError('Merchant not found', 404, 'MERCHANT_NOT_FOUND');
    }
    return this.toResponse(merchant);
  }

  async update(id: string, data: UpdateMerchantRequest, userId: string): Promise<MerchantResponse> {
    const merchant = await this.repository.findById(id);
    if (!merchant) {
      throw new AppError('Merchant not found', 404, 'MERCHANT_NOT_FOUND');
    }

    if (merchant.ownerUserId.toString() !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    const updateData: any = { ...data };
    if (data.geo) {
      updateData.geo = {
        type: 'Point',
        coordinates: [data.geo.lng, data.geo.lat],
      };
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update merchant', 500, 'UPDATE_FAILED');
    }

    await deleteCachePattern(`merchant:*:${id}*`);
    await deleteCachePattern('merchants:near:*');

    return this.toResponse(updated);
  }

  async findNearby(query: GetMerchantsQuery): Promise<PaginatedMerchants> {
    if (!query.lat || !query.lng) {
      throw new AppError('Latitude and longitude are required', 400, 'INVALID_QUERY');
    }

    const radius = query.radius || 5000;
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const cacheKey = `merchants:near:${query.lat}:${query.lng}:${radius}:${page}:${limit}:${query.open || false}:${query.query || ''}`;
    const cached = await getCache<PaginatedMerchants>(cacheKey);
    if (cached) {
      return cached;
    }

    const { merchants, total } = await this.repository.findNearby(
      query.lat,
      query.lng,
      radius,
      {
        open: query.open,
        query: query.query,
        isApproved: true,
      },
      page,
      limit
    );

    const result: PaginatedMerchants = {
      items: merchants.map((m) => this.toResponse(m)),
      total,
      page,
      limit,
    };

    await setCache(cacheKey, result, 30);

    return result;
  }

  async findPending(page: number, limit: number): Promise<PaginatedMerchants> {
    const { merchants, total } = await this.repository.findPending(page, limit);

    return {
      items: merchants.map((m) => this.toResponse(m)),
      total,
      page,
      limit,
    };
  }

  async verify(id: string, data: VerifyMerchantRequest, adminId: string): Promise<MerchantResponse> {
    const merchant = await this.repository.findById(id);
    if (!merchant) {
      throw new AppError('Merchant not found', 404, 'MERCHANT_NOT_FOUND');
    }

    const updated = await this.repository.verify(id, data.approved, adminId, data.notes);
    if (!updated) {
      throw new AppError('Failed to verify merchant', 500, 'VERIFY_FAILED');
    }

    await deleteCachePattern(`merchant:*:${id}*`);
    await deleteCachePattern('merchants:near:*');

    return this.toResponse(updated);
  }

  private toResponse(merchant: IMerchant): MerchantResponse {
    return {
      ...merchant.toObject(),
      ownerUserId: merchant.ownerUserId.toString(),
      riders: merchant.riders.map((r) => r.toString()),
    } as MerchantResponse;
  }
}

