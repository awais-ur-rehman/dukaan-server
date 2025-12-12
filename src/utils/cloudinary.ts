import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadImage = async (file: Buffer | string, folder?: string): Promise<UploadResult> => {
  try {
    const uploadOptions: any = {
      resource_type: 'image',
    };

    if (folder) {
      uploadOptions.folder = folder;
    }

    let result;
    if (typeof file === 'string') {
      result = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
      result = await cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) throw error;
        return result;
      }).end(file);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error}`);
  }
};

