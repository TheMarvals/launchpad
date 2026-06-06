'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- SHOWCASE PROJECTS ---

export async function getShowcaseProjects() {
  return prisma.showcaseProject.findMany({
    orderBy: { order: 'asc' },
    include: {
      images: { orderBy: { order: 'asc' } },
    },
  });
}

export async function getActiveShowcaseProjects() {
  return prisma.showcaseProject.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      images: { orderBy: { order: 'asc' } },
    },
  });
}

export async function getShowcaseProject(id: string) {
  return prisma.showcaseProject.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
    },
  });
}

export async function createShowcaseProject(data: {
  title: string;
  description?: string;
  category?: string;
  technologies?: string;
  clientName?: string;
  projectUrl?: string;
}) {
  const maxOrder = await prisma.showcaseProject.aggregate({
    _max: { order: true },
  });

  const project = await prisma.showcaseProject.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category || 'web',
      technologies: data.technologies || null,
      clientName: data.clientName || null,
      projectUrl: data.projectUrl || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath('/dashboard/showcase');
  revalidatePath('/', 'layout');
  return project;
}

export async function updateShowcaseProject(
  id: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    technologies?: string;
    clientName?: string;
    projectUrl?: string;
    isActive?: boolean;
    order?: number;
  }
) {
  const cleanData = {
    ...data,
    description: data.description === '' ? null : data.description,
    technologies: data.technologies === '' ? null : data.technologies,
    clientName: data.clientName === '' ? null : data.clientName,
    projectUrl: data.projectUrl === '' ? null : data.projectUrl,
  };

  const project = await prisma.showcaseProject.update({
    where: { id },
    data: cleanData,
  });

  revalidatePath('/dashboard/showcase');
  revalidatePath('/', 'layout');
  return project;
}

export async function deleteShowcaseProject(id: string) {
  await prisma.showcaseProject.delete({ where: { id } });
  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
}

// --- SHOWCASE IMAGES ---

export async function addShowcaseImage(
  projectId: string,
  data: {
    url: string;
    caption?: string;
    isFeatured?: boolean;
  }
) {
  const maxOrder = await prisma.showcaseImage.aggregate({
    _max: { order: true },
    where: { projectId },
  });

  // If this is the first image, make it featured
  const imageCount = await prisma.showcaseImage.count({ where: { projectId } });
  const isFeatured = imageCount === 0 ? true : (data.isFeatured ?? false);

  const image = await prisma.showcaseImage.create({
    data: {
      projectId,
      url: data.url,
      caption: data.caption || null,
      isFeatured,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return image;
}

export async function deleteShowcaseImage(id: string) {
  await prisma.showcaseImage.delete({ where: { id } });
  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
}

export async function setFeaturedImage(id: string, projectId: string) {
  // Unset all featured images in this project
  await prisma.showcaseImage.updateMany({
    where: { projectId },
    data: { isFeatured: false },
  });
  // Set the new featured image
  await prisma.showcaseImage.update({
    where: { id },
    data: { isFeatured: true },
  });
  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
}

export async function reorderImages(images: { id: string; order: number }[]) {
  for (const img of images) {
    await prisma.showcaseImage.update({
      where: { id: img.id },
      data: { order: img.order },
    });
  }
  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
}
