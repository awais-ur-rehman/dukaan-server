import { Request, Response, NextFunction } from 'express';
import { UploadService } from './service';
import { AppError } from '../../middleware/errorHandler';
import { type AuthRequest } from '../../middleware/auth';

export class UploadController {
  private service: UploadService;

  constructor() {
    this.service = new UploadService();
  }

  uploadImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { image, folder } = req.body;

      if (!image) {
        throw new AppError('Image is required', 400, 'VALIDATION_ERROR');
      }

      if (typeof image !== 'string') {
        throw new AppError('Image must be a base64 string', 400, 'VALIDATION_ERROR');
      }

      const result = await this.service.uploadImage(image, folder);

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

