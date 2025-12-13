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
    return Merchant.findOne({ ownerUserId: new mongoose.Types.ObjectId(ownerUserId) })
      .populate('ownerUserId', 'email name')
      .populate('riders', 'name phone active')
      .exec();
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
    // Build the match query for filters
    const matchQuery: any = {};

    if (filters.isApproved !== undefined) {
      matchQuery.isApproved = filters.isApproved;
    } else {
      matchQuery.isApproved = true;
    }

    if (filters.open) {
      const now = new Date();
      const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      matchQuery.openingHours = {
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

    // Add text search if query provided
    if (filters.query) {
      matchQuery.$or = [
        { 'names.en': { $regex: filters.query, $options: 'i' } },
        { 'names.ur': { $regex: filters.query, $options: 'i' } },
      ];
    }

    // Use aggregation pipeline with $geoNear for geospatial query with sorting
    const pipeline: any[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceField: 'distance',
          maxDistance: radiusMeters,
          spherical: true,
          query: matchQuery,
        },
      },
    ];

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    // Get total count using $geoWithin (for count, we don't need sorting)
    const radiusInRadians = radiusMeters / 6378100;
    const countQuery: any = {
      geo: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      },
      ...matchQuery,
    };

    const [merchants, total] = await Promise.all([
      Merchant.aggregate(pipeline).exec(),
      Merchant.countDocuments(countQuery),
    ]);

    // Convert aggregation results to Mongoose documents and populate
    const merchantIds = merchants.map((m) => new mongoose.Types.ObjectId(m._id));
    const populatedMerchants = await Merchant.find({ _id: { $in: merchantIds } })
      .populate('ownerUserId', 'email name')
      .exec();

    // Maintain sort order from aggregation (by distance)
    const sortedMerchants = merchantIds.map((id) =>
      populatedMerchants.find((m) => m._id.equals(id))
    ).filter(Boolean) as IMerchant[];

    return { merchants: sortedMerchants, total };
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

