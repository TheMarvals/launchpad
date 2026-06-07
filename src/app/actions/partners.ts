'use server';

import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

export async function getPartners() {
  return prisma.partner.findMany({
    orderBy: { order: 'asc' },
  });
}

export async function getActivePartners() {
  return prisma.partner.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
}

export async function createPartner(data: {
  name: string;
  logoUrl: string;
  websiteUrl?: string;
}) {
  const maxOrder = await prisma.partner.aggregate({
    _max: { order: true },
  });

  const partner = await prisma.partner.create({
    data: {
      name: data.name,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return partner;
}

export async function updatePartner(
  id: string,
  data: {
    name?: string;
    logoUrl?: string;
    websiteUrl?: string;
    isActive?: boolean;
    order?: number;
  }
) {
  const partner = await prisma.partner.update({
    where: { id },
    data: {
      ...data,
      websiteUrl: data.websiteUrl === '' ? null : data.websiteUrl,
    },
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return partner;
}

export async function deletePartner(id: string) {
  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { logoUrl: true },
  });

  if (partner?.logoUrl) {
    await deleteImage(partner.logoUrl).catch(e =>
      console.error('[Partners] Failed to delete logo from Cloudinary:', e)
    );
  }

  await prisma.partner.delete({ where: { id } });
  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
}
