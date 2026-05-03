'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendNewTicketNotificationToAdmin, sendTicketReplyNotificationToClient } from '@/lib/email';

// Crear un nuevo ticket
export async function createTicket(data: { subject: string; priority: string; message: string }) {
  const session = await auth();
  
  if (!session || !session.user) {
    return { error: 'No autorizado' };
  }

  const clientId = session.user.clientId;
  if (!clientId && session.user.role !== 'ADMIN') {
    return { error: 'Cliente no válido' };
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        subject: data.subject,
        priority: data.priority,
        status: 'OPEN',
        clientId: clientId as string,
        userId: session.user.id,
        messages: {
          create: {
            message: data.message,
            userId: session.user.id,
          }
        }
      }
    });

    // Obtener info del cliente para el email
    const client = await prisma.client.findUnique({ where: { id: clientId as string } });

    // Notificar al admin
    sendNewTicketNotificationToAdmin({
      ticketId: ticket.id,
      subject: data.subject,
      priority: data.priority,
      message: data.message,
      clientName: client?.razonSocial || session.user.name || 'Cliente',
      clientEmail: session.user.email || '',
      senderName: session.user.name || 'Usuario',
      senderRole: session.user.role || 'CLIENT',
    }).catch(e => console.error('Error sending ticket email:', e));

    revalidatePath('/client-portal/tickets');
    revalidatePath('/dashboard/tickets');
    
    return { success: true, ticketId: ticket.id };
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return { error: 'Error al crear el ticket.' };
  }
}

// Obtener tickets de un cliente
export async function getClientTickets() {
  const session = await auth();
  
  if (!session || !session.user || !session.user.clientId) {
    return [];
  }

  return await prisma.ticket.findMany({
    where: { clientId: session.user.clientId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
}

// Obtener todos los tickets (Para Admin)
export async function getAllTickets() {
  const session = await auth();
  
  if (!session || session.user?.role !== 'ADMIN') {
    return [];
  }

  return await prisma.ticket.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      client: {
        select: { razonSocial: true }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
}

// Obtener detalles de un ticket específico
export async function getTicketDetails(ticketId: string) {
  const session = await auth();
  
  if (!session || !session.user) {
    return null;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      client: true,
      user: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { name: true, email: true, role: true } }
        }
      }
    }
  });

  if (!ticket) return null;

  // Si es cliente, solo puede ver sus propios tickets
  if (session.user.role === 'CLIENT' && ticket.clientId !== session.user.clientId) {
    return null;
  }

  return ticket;
}

// Enviar un mensaje en un ticket existente
export async function sendTicketMessage(ticketId: string, message: string) {
  const session = await auth();
  
  if (!session || !session.user) {
    return { error: 'No autorizado' };
  }

  try {
    // Verificar permisos
    const ticket = await prisma.ticket.findUnique({ 
      where: { id: ticketId },
      include: { user: true }
    });
    if (!ticket) return { error: 'Ticket no encontrado' };

    if (session.user.role === 'CLIENT' && ticket.clientId !== session.user.clientId) {
      return { error: 'No tienes permiso para ver este ticket' };
    }

    // Agregar mensaje
    await prisma.ticketMessage.create({
      data: {
        ticketId,
        message,
        userId: session.user.id
      }
    });

    // Actualizar el estado del ticket y su fecha de modificación
    let newStatus = ticket.status;
    if (session.user.role === 'ADMIN' && ticket.status === 'OPEN') {
      newStatus = 'IN_PROGRESS';
    } else if (session.user.role === 'CLIENT' && ticket.status === 'CLOSED') {
       // Si el cliente responde un ticket cerrado, se reabre automáticamente
      newStatus = 'OPEN';
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // Enviar notificaciones
    if (session.user.role === 'ADMIN' && ticket.userId !== session.user.id) {
      // El admin responde a un cliente
      sendTicketReplyNotificationToClient({
        ticketId: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        message: '', // No usado en el template del cliente
        clientName: ticket.user.name || 'Cliente',
        clientEmail: ticket.user.email,
        senderName: session.user.name || 'Soporte MARVAL',
        senderRole: 'ADMIN',
        replyMessage: message,
      }).catch(e => console.error('Error sending reply email:', e));
    } else if (session.user.role === 'CLIENT') {
      // El cliente responde al ticket
      const clientInfo = await prisma.client.findUnique({ where: { id: ticket.clientId } });
      sendNewTicketNotificationToAdmin({
        ticketId: ticket.id,
        subject: `Re: ${ticket.subject}`,
        priority: ticket.priority,
        message: message,
        clientName: clientInfo?.razonSocial || session.user.name || 'Cliente',
        clientEmail: session.user.email || '',
        senderName: session.user.name || 'Usuario',
        senderRole: 'CLIENT',
      }).catch(e => console.error('Error sending reply email to admin:', e));
    }

    revalidatePath(`/client-portal/tickets/${ticketId}`);
    revalidatePath(`/dashboard/tickets/${ticketId}`);
    revalidatePath('/client-portal/tickets');
    revalidatePath('/dashboard/tickets');

    return { success: true };
  } catch (error: any) {
    console.error('Error enviando mensaje:', error);
    return { error: 'No se pudo enviar el mensaje' };
  }
}

// Actualizar el estado de un ticket (Solo admin, o cliente para cerrarlo)
export async function updateTicketStatus(ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') {
  const session = await auth();
  
  if (!session || !session.user) {
    return { error: 'No autorizado' };
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { error: 'Ticket no encontrado' };

    // Si es cliente, solo puede cerrar sus tickets
    if (session.user.role === 'CLIENT') {
      if (ticket.clientId !== session.user.clientId) return { error: 'Sin permisos' };
      if (status !== 'CLOSED') return { error: 'Los clientes solo pueden cerrar tickets' };
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    });

    revalidatePath(`/client-portal/tickets/${ticketId}`);
    revalidatePath(`/dashboard/tickets/${ticketId}`);
    revalidatePath('/client-portal/tickets');
    revalidatePath('/dashboard/tickets');

    return { success: true };
  } catch (error: any) {
    return { error: 'Error al actualizar el ticket' };
  }
}
