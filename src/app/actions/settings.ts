'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

/**
 * Ensures the user is an ADMIN before allowing access.
 */
async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session.user;
}

// --- COMPANY PROFILE ---

export async function getCompanyProfile() {
  const user = await ensureAdmin();
  let profile = await prisma.companyProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          cargo: true,
          telefono: true,
        },
      },
    },
  });

  if (!profile) {
    profile = await prisma.companyProfile.create({
      data: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            cargo: true,
            telefono: true,
          },
        },
      },
    });
  }

  return profile;
}

export async function updateCompanyProfile(data: any) {
  const user = await ensureAdmin();
  // Strip out relation before update to prevent Prisma crash
  const { user: userRelation, ...profileData } = data;
  const profile = await prisma.companyProfile.update({
    where: { userId: user.id },
    data: profileData,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          cargo: true,
          telefono: true,
        },
      },
    },
  });
  revalidatePath('/dashboard/settings');
  return profile;
}

// --- TEAM MANAGEMENT (ADMINS) ---

export async function getAdmins() {
  await ensureAdmin();
  return await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      name: true,
      email: true,
      cargo: true,
      telefono: true,
      createdAt: true,
      isActive: true,
      permissions: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAdminsForQuote() {
  await ensureAdmin();
  return await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      cargo: true,
      telefono: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function createAdmin(data: { name: string; email: string; password?: string; permissions?: string[]; cargo?: string; telefono?: string }) {
  await ensureAdmin();
  
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const defaultPassword = data.password || 'Launchpad2026!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      permissions: data.permissions || [],
      cargo: data.cargo || null,
      telefono: data.telefono || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      cargo: true,
      telefono: true,
      createdAt: true,
      isActive: true,
      permissions: true,
    }
  });
  
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  revalidatePath('/');
  return admin;
}

export async function deleteAdmin(id: string) {
  const currentUser = await ensureAdmin();
  
  if (currentUser.id === id) {
    throw new Error('You cannot delete yourself');
  }

  await prisma.user.delete({
    where: { id },
  });
  
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateAdmin(id: string, data: { name: string; email: string; permissions?: string[]; cargo?: string; telefono?: string }) {
  await ensureAdmin();
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser && existingUser.id !== id) {
    throw new Error('User with this email already exists');
  }

  const admin = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
      cargo: data.cargo !== undefined ? (data.cargo || null) : undefined,
      telefono: data.telefono !== undefined ? (data.telefono || null) : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      cargo: true,
      telefono: true,
      createdAt: true,
      isActive: true,
      permissions: true,
    }
  });
  
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  revalidatePath('/');
  return admin;
}

export async function resetAdminPassword(id: string, password?: string) {
  await ensureAdmin();
  const newPassword = password || 'Launchpad2026!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
    },
  });

  return { success: true };
}
