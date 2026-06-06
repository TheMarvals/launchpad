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
  });

  if (!profile) {
    profile = await prisma.companyProfile.create({
      data: { userId: user.id },
    });
  }

  return profile;
}

export async function updateCompanyProfile(data: any) {
  const user = await ensureAdmin();
  const profile = await prisma.companyProfile.update({
    where: { userId: user.id },
    data,
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
      createdAt: true,
      isActive: true,
      permissions: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createAdmin(data: { name: string; email: string; password?: string; permissions?: string[] }) {
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
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      isActive: true,
      permissions: true,
    }
  });
  
  revalidatePath('/dashboard/settings');
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
  return { success: true };
}

export async function updateAdmin(id: string, data: { name: string; email: string; permissions?: string[] }) {
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
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      isActive: true,
      permissions: true,
    }
  });
  
  revalidatePath('/dashboard/settings');
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
