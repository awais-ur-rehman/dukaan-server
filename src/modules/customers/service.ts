import { CustomerRepository } from './repository';
import { type UpdateProfileRequest } from './dto';
import { AppError } from '../../middleware/errorHandler';

export class CustomerService {
  private repository: CustomerRepository;

  constructor() {
    this.repository = new CustomerRepository();
  }

  async getProfile(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      profileCompleted: user.profileCompleted,
      locale: user.locale,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileRequest) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updated = await this.repository.updateProfile(userId, data);
    if (!updated) {
      throw new AppError('Failed to update profile', 500, 'UPDATE_FAILED');
    }

    return {
      _id: updated._id.toString(),
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      role: updated.role,
      profileCompleted: updated.profileCompleted,
      locale: updated.locale,
    };
  }
}

