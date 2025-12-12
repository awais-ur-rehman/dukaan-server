import { Rider, type IRider } from '../../models/Rider';
import { User } from '../../models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export class RiderRepository {
  async create(data: {
    merchantId: string;
    name: string;
    phone: string;
    email: string;
    vehicleType?: string;
  }): Promise<{ rider: IRider; password: string }> {
    const user = new User({
      email: data.email.toLowerCase(),
      role: 'rider',
      name: data.name,
      phone: data.phone,
      profileCompleted: true,
    });

    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    user.passwordHash = await bcrypt.hash(tempPassword, 10);
    await user.save();

    const rider = new Rider({
      merchantId: new mongoose.Types.ObjectId(data.merchantId),
      userId: user._id,
      name: data.name,
      phone: data.phone,
      vehicleType: data.vehicleType,
      active: true,
    });

    await rider.save();

    return { rider, password: tempPassword };
  }

  async findByMerchantId(merchantId: string, page: number, limit: number): Promise<{ riders: IRider[]; total: number }> {
    const query = { merchantId: new mongoose.Types.ObjectId(merchantId) };
    const total = await Rider.countDocuments(query);
    const riders = await Rider.find(query)
      .populate('userId', 'email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { riders, total };
  }

  async findById(id: string): Promise<IRider | null> {
    return Rider.findById(id).populate('userId', 'email').exec();
  }

  async update(id: string, data: Partial<IRider>): Promise<IRider | null> {
    return Rider.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

