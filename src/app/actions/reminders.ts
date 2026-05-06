'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sendRemindersEmail } from '@/lib/email';
import { sendTelegramMessage } from '@/lib/telegram';
import { getProductivitySettings } from './productivity';

/**
 * Ensures the user is an ADMIN before allowing access to reminder features.
 */
async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session.user;
}

export async function getUpcomingReminders() {
  const user = await ensureAdmin();
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  // 1. Upcoming Tasks
  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: { not: 'done' },
      dueDate: {
        gte: now,
        lte: nextWeek,
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  // 2. Upcoming Calendar Events
  const events = await prisma.calendarEvent.findMany({
    where: {
      userId: user.id,
      start: {
        gte: now,
        lte: nextWeek,
      },
    },
    orderBy: { start: 'asc' },
  });

  // 3. VPS Expirations
  const vpsExpirations = await prisma.vpsService.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: nextWeek,
      },
    },
    include: {
      client: true,
    },
    orderBy: { dueDate: 'asc' },
  });

  // 4. Open/In-Progress Tickets
  const openTickets = await prisma.ticket.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
    include: {
      client: { select: { razonSocial: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // 5. Expiring Quotes (next 7 days)
  const expiringQuotes = await prisma.quote.findMany({
    where: {
      estado: 'Enviada',
      fechaValidez: {
        gte: now,
        lte: nextWeek,
      },
    },
    include: {
      client: { select: { razonSocial: true } },
    },
    orderBy: { fechaValidez: 'asc' },
  });

  // 6. Failed Audit Logs (last 24h)
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const failedActions = await prisma.actionLog.findMany({
    where: {
      status: 'FAILED',
      createdAt: { gte: yesterday },
    },
    include: {
      server: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    tasks,
    events,
    vpsExpirations,
    openTickets,
    expiringQuotes,
    failedActions,
  };
}

export async function triggerRemindersNotification(locale: string = 'es') {
  const user = await ensureAdmin();
  const data = await getUpcomingReminders();
  const settings = await getProductivitySettings();

  const results = {
    telegram: false,
    email: false,
    error: null as string | null
  };

  try {
    // 1. Send Email (Always if there is an email)
    if (user.email) {
      await sendRemindersEmail(user.email, user.name || 'Admin', data, locale);
      results.email = true;
    }

    // 2. Send Telegram (If enabled)
    if (settings.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
      let message = `🚀 <b>RECORDATORIOS PRÓXIMOS</b>\n\n`;
      
        if (data.vpsExpirations.length > 0) {
      message += `💾 <b>VPS A VENCER:</b>\n`;
      data.vpsExpirations.forEach(v => {
        const dateStr = v.dueDate ? new Date(v.dueDate).toLocaleDateString(locale) : 'N/A';
        message += `- ${v.name} (${v.client.razonSocial}): ${dateStr}\n`;
      });
      message += `\n`;
    }

    if (data.tasks.length > 0) {
      message += `✅ <b>TAREAS:</b>\n`;
      data.tasks.forEach(t => {
        const dateStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString(locale) : 'N/A';
        message += `- ${t.title}: ${dateStr}\n`;
      });
      message += `\n`;
    }

      if (data.events.length > 0) {
        message += `📅 <b>EVENTOS:</b>\n`;
        data.events.forEach(e => {
          message += `- ${e.title}: ${new Date(e.start).toLocaleDateString(locale)} ${new Date(e.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}\n`;
        });
        message += `\n`;
      }

      if (data.openTickets.length > 0) {
        message += `🎫 <b>TICKETS PENDIENTES:</b>\n`;
        data.openTickets.forEach(t => {
          message += `- [${t.status}] ${t.subject} (${t.client.razonSocial})\n`;
        });
        message += `\n`;
      }

      if (data.expiringQuotes.length > 0) {
        message += `📄 <b>COTIZACIONES POR VENCER:</b>\n`;
        data.expiringQuotes.forEach(q => {
          message += `- #${q.correlativo} (${q.client.razonSocial}): ${new Date(q.fechaValidez).toLocaleDateString(locale)}\n`;
        });
        message += `\n`;
      }

      if (data.failedActions.length > 0) {
        message += `⚠️ <b>FALLOS EN SERVIDORES (24h):</b>\n`;
        data.failedActions.forEach(a => {
          message += `- ${a.action} en ${a.server.name} (${a.user.name})\n`;
        });
      }

      const telegramRes = await sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, message);
      results.telegram = telegramRes.success;
    }

    return { success: true, results };
  } catch (error: any) {
    console.error('Error triggering reminders:', error);
    return { success: false, error: error.message };
  }
}
