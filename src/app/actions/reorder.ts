'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type PrismaModelName = 'partner' | 'showcaseProject';

const modelMap: Record<PrismaModelName, any> = {
  partner: prisma.partner,
  showcaseProject: prisma.showcaseProject,
};

/**
 * Reorder two items by swapping their `order` values.
 * Works with any model that has `id` and `order` fields.
 */
export async function reorderItems(
  model: PrismaModelName,
  id1: string,
  id2: string,
  revalidatePaths: Array<{ path: string; type?: 'page' | 'layout' }> = []
) {
  const db = modelMap[model];
  if (!db) throw new Error(`Unknown model: ${model}`);

  const [item1, item2] = await Promise.all([
    db.findUnique({ where: { id: id1 }, select: { order: true } }),
    db.findUnique({ where: { id: id2 }, select: { order: true } }),
  ]);

  if (!item1 || !item2) throw new Error('One or both items not found');

  await Promise.all([
    db.update({ where: { id: id1 }, data: { order: item2.order } }),
    db.update({ where: { id: id2 }, data: { order: item1.order } }),
  ]);

  for (const { path, type } of revalidatePaths) {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  }
}
