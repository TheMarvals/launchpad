'use server';

import { prisma } from '@/lib/prisma';
import { listCloudinaryResources, deleteImageByPublicId } from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

export async function getOrphanedCloudinaryImages() {
  try {
    // Get all images stored in Cloudinary under the showcase folder
    const cloudinaryImages = await listCloudinaryResources('launchpad/showcase');

    // Get all image URLs currently referenced in the database
    const dbImages = await prisma.showcaseImage.findMany({
      select: { url: true },
    });
    const dbUrls = new Set(dbImages.map(img => img.url));

    // Find images that exist in Cloudinary but not in the database
    const orphaned = cloudinaryImages.filter(img => !dbUrls.has(img.url));

    return {
      orphaned: orphaned.map(img => ({
        publicId: img.publicId,
        url: img.url,
        createdAt: img.createdAt.toISOString(),
      })),
      totalInCloudinary: cloudinaryImages.length,
      totalInDatabase: dbImages.length,
      orphanedCount: orphaned.length,
    };
  } catch (error: any) {
    console.error('[Cleanup] Error scanning orphaned images:', error);
    return {
      error: error.message || 'Failed to scan Cloudinary',
      orphaned: [],
      totalInCloudinary: 0,
      totalInDatabase: 0,
      orphanedCount: 0,
    };
  }
}

export async function deleteOrphanedImage(publicId: string) {
  try {
    await deleteImageByPublicId(publicId);
    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error: any) {
    console.error(`[Cleanup] Error deleting ${publicId}:`, error);
    return { error: error.message || 'Failed to delete image' };
  }
}

export async function deleteAllOrphanedImages(publicIds: string[]) {
  const results = [];
  for (const publicId of publicIds) {
    const result = await deleteOrphanedImage(publicId);
    results.push({ publicId, ...result });
  }
  revalidatePath('/dashboard/settings');
  return { results };
}
