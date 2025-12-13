import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { 
  sendOTPDto, 
  verifyOTPDto, 
  refreshTokenDto,
  signupDto,
  verifySignupOtpDto,
  loginDto,
  resetPasswordRequestDto,
  resetPasswordDto
} from './dto';
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

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = signupDto.parse(req.body);
      const result = await this.service.signup(
        validated.name,
        validated.email,
        validated.phone,
        validated.password
      );

      res.status(200).json({
        success: true,
        message: 'OTP sent to email',
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

  verifySignupOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = verifySignupOtpDto.parse(req.body);
      const result = await this.service.verifySignupOtp(validated.otpId, validated.code);

      res.status(200).json({
        success: true,
        message: 'Account created successfully',
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

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = loginDto.parse(req.body);
      const result = await this.service.login(validated.email, validated.password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
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

  riderLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = loginDto.parse(req.body);
      const result = await this.service.riderLogin(validated.email, validated.password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
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

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = resetPasswordRequestDto.parse(req.body);
      const result = await this.service.requestPasswordReset(validated.email);

      res.status(200).json({
        success: true,
        message: 'OTP sent to email',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
      } else if (error instanceof AppError && error.code === 'OTP_SENT') {
        // Return success even if user doesn't exist (security)
        res.status(200).json({
          success: true,
          message: 'If an account exists with this email, a password reset OTP has been sent.',
          data: { otpId: 'dummy' },
        });
      } else {
        next(error);
      }
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = resetPasswordDto.parse(req.body);
      await this.service.resetPassword(validated.otpId, validated.code, validated.newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error));
      } else {
        next(error);
      }
    }
  };
}

