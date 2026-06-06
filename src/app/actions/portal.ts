'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createClientUser(clientId: string, data: any) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('Ya existe un usuario con este correo electrónico.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'CLIENT',
        clientId: clientId,
      }
    });

    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al crear el usuario' };
  }
}

export async function bindVpsServer(clientId: string, data: any) {
  try {
    await prisma.vpsService.create({
      data: {
        clientId: clientId,
        name: data.name,
        hostname: data.hostname,
        providerId: data.providerId,
        ipAddress: data.ipAddress,
        status: 'active'
      }
    });

    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al vincular el servidor' };
  }
}

export async function updateClientUser(userId: string, data: { name: string; email: string; password?: string }) {
  try {
    const updateData: any = {
      name: data.name,
      email: data.email,
    };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { clientId: true },
    });

    if (user.clientId) {
      revalidatePath(`/dashboard/clients/${user.clientId}`);
    }
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Ya existe un usuario con este correo electrónico.' };
    }
    return { error: error.message || 'Error al actualizar el usuario' };
  }
}

export async function toggleUserAccess(userId: string, isActive: boolean) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });
    
    if (user.clientId) {
      revalidatePath(`/dashboard/clients/${user.clientId}`);
    }
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al cambiar estado del usuario' };
  }
}

export async function deleteClientUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clientId: true } });
    if (!user) throw new Error('Usuario no encontrado');

    await prisma.user.delete({ where: { id: userId } });

    if (user.clientId) {
      revalidatePath(`/dashboard/clients/${user.clientId}`);
    }
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar el usuario' };
  }
}

export async function deleteVpsService(vpsId: string) {
  try {
    const vps = await prisma.vpsService.findUnique({ where: { id: vpsId }, select: { clientId: true } });
    if (!vps) throw new Error('Servidor no encontrado');

    await prisma.vpsService.delete({ where: { id: vpsId } });

    if (vps.clientId) {
      revalidatePath(`/dashboard/clients/${vps.clientId}`);
    }
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar el servidor' };
  }
}

export async function updateVpsService(vpsId: string, data: { name: string; hostname?: string; dueDate: string | null; providerId: string; ipAddress: string }) {
  try {
    const vps = await prisma.vpsService.update({
      where: { id: vpsId },
      data: {
        name: data.name,
        hostname: data.hostname,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        providerId: data.providerId,
        ipAddress: data.ipAddress
      }
    });

    revalidatePath(`/dashboard/clients/${vps.clientId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al actualizar VPS' };
  }
}
