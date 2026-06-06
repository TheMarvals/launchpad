import { v2 as cloudinary } from 'cloudinary';

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export async function uploadImage(file: string): Promise<string> {
  const client = getCloudinary();
  const result = await client.uploader.upload(file, {
    folder: 'launchpad/showcase',
    resource_type: 'image',
  });
  return result.secure_url;
}

export async function deleteImage(url: string): Promise<void> {
  // Extract public_id from Cloudinary URL
  // URL format: /v{version}/{folder}/{filename}.{ext}
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Find the upload index and take everything after it until the last dot
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return;
    const publicIdWithExt = pathParts.slice(uploadIndex + 2).join('/'); // skip 'upload' and version
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, ''); // remove extension
    const client = getCloudinary();
    await client.uploader.destroy(publicId);
  } catch {
    // Ignore errors if image doesn't exist
  }
}

export default cloudinary;
