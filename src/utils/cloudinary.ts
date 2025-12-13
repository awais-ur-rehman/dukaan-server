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
      let uploadString = file;
      if (!file.startsWith('data:')) {
        uploadString = `data:image/jpeg;base64,${file}`;
      }
      result = await cloudinary.uploader.upload(uploadString, uploadOptions);
    } else {
      result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        uploadStream.end(file);
      });
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

