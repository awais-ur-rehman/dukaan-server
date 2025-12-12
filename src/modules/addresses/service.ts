import { AddressRepository } from './repository';
import { type CreateAddressRequest, type UpdateAddressRequest } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type IAddress } from '../../models/Address';

export class AddressService {
  private repository: AddressRepository;

  constructor() {
    this.repository = new AddressRepository();
  }

  async create(customerId: string, data: CreateAddressRequest) {
    if (data.isDefault) {
      await this.repository.setDefault('', customerId);
    }

    const address = await this.repository.create({
      customerId,
      label: data.label,
      addressText: data.addressText,
      geo: {
        type: 'Point',
        coordinates: [data.geo.lng, data.geo.lat],
      },
      phone: data.phone,
      isDefault: data.isDefault || false,
    });

    return this.toResponse(address);
  }

  async findByCustomerId(customerId: string) {
    const addresses = await this.repository.findByCustomerId(customerId);
    return addresses.map((a) => this.toResponse(a));
  }

  async update(id: string, customerId: string, data: UpdateAddressRequest) {
    const address = await this.repository.findById(id);
    if (!address || address.customerId.toString() !== customerId) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    if (data.isDefault) {
      await this.repository.setDefault(id, customerId);
    }

    const updateData: any = { ...data };
    if (data.geo) {
      updateData.geo = {
        type: 'Point',
        coordinates: [data.geo.lng, data.geo.lat],
      };
    }

    const updated = await this.repository.update(id, customerId, updateData);
    if (!updated) {
      throw new AppError('Failed to update address', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  async delete(id: string, customerId: string) {
    const address = await this.repository.findById(id);
    if (!address || address.customerId.toString() !== customerId) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    const deleted = await this.repository.delete(id, customerId);
    if (!deleted) {
      throw new AppError('Failed to delete address', 500, 'DELETE_FAILED');
    }
  }

  async setDefault(id: string, customerId: string) {
    await this.repository.setDefault(id, customerId);
    const address = await this.repository.findById(id);
    if (!address) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }
    return this.toResponse(address);
  }

  private toResponse(address: IAddress) {
    return {
      _id: address._id.toString(),
      label: address.label,
      addressText: address.addressText,
      geo: {
        lat: address.geo.coordinates[1],
        lng: address.geo.coordinates[0],
      },
      phone: address.phone,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}

