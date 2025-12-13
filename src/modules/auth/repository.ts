import { User, type IUser, type UserRole } from '../../models/User';
import bcrypt from 'bcrypt';

export class AuthRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  async createUser(
    email: string,
    role: UserRole,
    name?: string,
    phone?: string,
    passwordHash?: string
  ): Promise<IUser> {
    const userData: any = {
      email: email.toLowerCase(),
      role,
      name,
      phone,
      profileCompleted: false,
    };
    
    if (passwordHash) {
      userData.passwordHash = passwordHash;
    }
    
    const user = new User(userData);
    return user.save();
  }

  async addRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          tokenHash,
          createdAt: new Date(),
          expiresAt,
        },
      },
    }).exec();
  }

  async findRefreshToken(userId: string, tokenHash: string): Promise<boolean> {
    const user = await User.findById(userId).exec();
    if (!user || !user.refreshTokens) return false;

    return user.refreshTokens.some(
      (rt) => rt.tokenHash === tokenHash && rt.expiresAt > new Date()
    );
  }

  async removeRefreshToken(userId: string, tokenHash: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { tokenHash } },
    }).exec();
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(userId, { passwordHash }).exec();
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await User.findById(userId).exec();
    if (!user || !user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

  async verifyPasswordByEmail(email: string, password: string): Promise<IUser | null> {
    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user || !user.passwordHash) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  async updateUser(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, updates, { new: true }).exec();
  }

  async invalidateAllRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    }).exec();
  }
}

