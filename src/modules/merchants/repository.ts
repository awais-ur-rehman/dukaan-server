import { Merchant, type IMerchant } from '../../models/Merchant';
import mongoose from 'mongoose';

export class MerchantRepository {
  async create(data: Partial<IMerchant>): Promise<IMerchant> {
    const merchant = new Merchant(data);
    return merchant.save();
  }

  async findById(id: string): Promise<IMerchant | null> {
    return Merchant.findById(id)
      .populate('ownerUserId', 'email name')
      .populate('riders', 'name phone active')
      .exec();
  }

  async findByOwnerId(ownerUserId: string): Promise<IMerchant | null> {
    return Merchant.findOne({ ownerUserId: new mongoose.Types.ObjectId(ownerUserId) }).exec();
  }

  async update(id: string, data: Partial<IMerchant>): Promise<IMerchant | null> {
    return Merchant.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusMeters: number,
    filters: {
      open?: boolean;
      query?: string;
      isApproved?: boolean;
    },
    page: number,
    limit: number
  ): Promise<{ merchants: IMerchant[]; total: number }> {
    const query: any = {
      geo: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusMeters,
        },
      },
    };

    if (filters.isApproved !== undefined) {
      query.isApproved = filters.isApproved;
    } else {
      query.isApproved = true;
    }

    if (filters.open) {
      const now = new Date();
      const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      query.openingHours = {
        $elemMatch: {
          day,
          slots: {
            $elemMatch: {
              start: { $lte: currentTime },
              end: { $gte: currentTime },
            },
          },
        },
      };
    }

    const total = await Merchant.countDocuments(query);
    const merchants = await Merchant.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { merchants, total };
  }

  async findPending(page: number, limit: number): Promise<{ merchants: IMerchant[]; total: number }> {
    const query = { isApproved: false };
    const total = await Merchant.countDocuments(query);
    const merchants = await Merchant.find(query)
      .populate('ownerUserId', 'email name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { merchants, total };
  }

  async verify(id: string, approved: boolean, adminId: string, notes?: string): Promise<IMerchant | null> {
    return Merchant.findByIdAndUpdate(
      id,
      {
        isApproved: approved,
        'verification.adminId': new mongoose.Types.ObjectId(adminId),
        'verification.verifiedAt': new Date(),
        'verification.notes': notes,
      },
      { new: true }
    ).exec();
  }
}

