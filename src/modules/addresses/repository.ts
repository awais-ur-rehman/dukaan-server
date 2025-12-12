import { Address, type IAddress } from '../../models/Address';
import mongoose from 'mongoose';

export class AddressRepository {
  async create(data: Partial<IAddress>): Promise<IAddress> {
    const address = new Address(data);
    return address.save();
  }

  async findById(id: string): Promise<IAddress | null> {
    return Address.findById(id).exec();
  }

  async findByCustomerId(customerId: string): Promise<IAddress[]> {
    return Address.find({ customerId: new mongoose.Types.ObjectId(customerId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async update(id: string, customerId: string, data: Partial<IAddress>): Promise<IAddress | null> {
    return Address.findOneAndUpdate(
      { _id: id, customerId: new mongoose.Types.ObjectId(customerId) },
      data,
      { new: true }
    ).exec();
  }

  async delete(id: string, customerId: string): Promise<boolean> {
    const result = await Address.findOneAndDelete({
      _id: id,
      customerId: new mongoose.Types.ObjectId(customerId),
    }).exec();
    return !!result;
  }

  async setDefault(id: string, customerId: string): Promise<void> {
    await Address.updateMany(
      { customerId: new mongoose.Types.ObjectId(customerId) },
      { isDefault: false }
    ).exec();
    await Address.findByIdAndUpdate(id, { isDefault: true }).exec();
  }
}

