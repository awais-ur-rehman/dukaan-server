import { uploadImage as cloudinaryUploadImage } from '../../utils/cloudinary';

export class UploadService {
  async uploadImage(base64Image: string, folder?: string): Promise<{ url: string; publicId: string }> {
    try {
      const result = await cloudinaryUploadImage(base64Image, folder || 'products');
      return result;
    } catch (error) {
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

