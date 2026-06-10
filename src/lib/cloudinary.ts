import { v2 as cloudinary } from 'cloudinary';

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export interface UploadResult {
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  colors?: string[];
}

export async function uploadImage(file: string): Promise<UploadResult> {
  const client = getCloudinary();
  const result = await client.uploader.upload(file, {
    folder: 'launchpad/showcase',
    resource_type: 'image',
    image_metadata: true,
    colors: true,
  });

  // Extract dominant colors (top 3)
  const colors: string[] = [];
  if (result.colors && Array.isArray(result.colors)) {
    for (const [color] of result.colors.slice(0, 3)) {
      colors.push(color);
    }
  }

  return {
    url: result.secure_url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    colors: colors.length > 0 ? colors : undefined,
  };
}

export async function listCloudinaryResources(folder: string): Promise<{ publicId: string; url: string; createdAt: Date }[]> {
  const client = getCloudinary();
  const results: { publicId: string; url: string; createdAt: Date }[] = [];
  let nextCursor: string | undefined;

  do {
    const response: any = await client.api.resources({
      type: 'upload',
      prefix: folder,
      resource_type: 'image',
      max_results: 500,
      next_cursor: nextCursor,
    });

    for (const resource of response.resources) {
      results.push({
        publicId: resource.public_id,
        url: resource.secure_url,
        createdAt: new Date(resource.created_at),
      });
    }

    nextCursor = response.next_cursor;
  } while (nextCursor);

  return results;
}

export async function deleteImageByPublicId(publicId: string): Promise<void> {
  const client = getCloudinary();
  await client.uploader.destroy(publicId);
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
