import { RiderRepository } from './repository';
import { type CreateRiderRequest, type UpdateRiderRequest } from './dto';
import { AppError } from '../../middleware/errorHandler';

export class RiderService {
  private repository: RiderRepository;

  constructor() {
    this.repository = new RiderRepository();
  }

  async create(merchantId: string, data: CreateRiderRequest) {
    const { rider, password } = await this.repository.create({
      ...data,
      merchantId,
    });

    return {
      rider: {
        _id: rider._id.toString(),
        name: rider.name,
        phone: rider.phone,
        email: data.email,
        vehicleType: rider.vehicleType,
        active: rider.active,
      },
      password,
    };
  }

  async findByMerchantId(merchantId: string, page: number = 1, limit: number = 20) {
    const { riders, total } = await this.repository.findByMerchantId(merchantId, page, limit);

    return {
      items: riders.map((r) => ({
        _id: r._id.toString(),
        name: r.name,
        phone: r.phone,
        vehicleType: r.vehicleType,
        active: r.active,
        earnings: r.earnings,
      })),
      total,
      page,
      limit,
    };
  }

  async update(id: string, data: UpdateRiderRequest) {
    const rider = await this.repository.findById(id);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_NOT_FOUND');
    }

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new AppError('Failed to update rider', 500, 'UPDATE_FAILED');
    }

    return updated;
  }
}

