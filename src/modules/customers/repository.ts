import { User, type IUser } from '../../models/User';

export class CustomerRepository {
  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; locale?: string }): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, data, { new: true }).exec();
  }
}

