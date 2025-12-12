import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { sendOTPDto, verifyOTPDto, refreshTokenDto } from './dto';
import { AppError } from '../../middleware/errorHandler';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  sendOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = sendOTPDto.parse(req.body);
      const result = await this.service.sendOTP(validated.email, validated.purpose);

      res.status(200).json({
        success: true,
        message: 'OTP queued',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
      } else {
        next(error);
      }
    }
  };

  verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = verifyOTPDto.parse(req.body);
      const result = await this.service.verifyOTP(validated.otpId, validated.code);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
      } else {
        next(error);
      }
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = refreshTokenDto.parse(req.body);
      const result = await this.service.refreshAccessToken(validated.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
      } else {
        next(error);
      }
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const refreshToken = req.body.refreshToken;

      if (!userId || !refreshToken) {
        throw new AppError('User ID and refresh token required', 400, 'INVALID_REQUEST');
      }

      await this.service.logout(userId, refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

