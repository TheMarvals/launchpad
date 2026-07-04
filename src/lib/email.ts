import { Resend } from 'resend';
import { render } from '@react-email/components';
import * as React from 'react';

// Email Templates
import TicketNotificationEmail from '../emails/TicketNotificationEmail';
import SecurityOtpEmail from '../emails/SecurityOtpEmail';
import RemindersEmail from '../emails/RemindersEmail';
import CalendarNotificationEmail from '../emails/CalendarNotificationEmail';
import TaskAssignedEmail from '@/emails/TaskAssignedEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

interface TicketEmailData {
  ticketId: string;
  subject: string;
  priority: string;
  message: string;
  clientName: string;
  clientEmail: string;
  senderName: string;
  senderRole: string;
}

// Email locale translations helper
function t(locale: string, es: string, en: string) {
  return locale === 'en' ? en : es;
}

const getFromEmail = (locale: string, department: string) => {
  return `"LAUNCHPAD ${t(locale, department, department === 'Soporte' ? 'Support' : department === 'Seguridad' ? 'Security' : 'Portal')}" <${process.env.USERM || 'onboarding@resend.dev'}>`;
};

export async function sendNewTicketNotificationToAdmin(data: TicketEmailData, locale: string = 'es') {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.USERM;
  if (!adminEmail) return;

  console.log(`[Email] Preparing new ticket email for admin: ${adminEmail} (locale: ${locale})`);

  try {
    const html = await render(
      React.createElement(TicketNotificationEmail, {
        type: 'NEW_TICKET',
        ticketId: data.ticketId,
        subject: data.subject,
        message: data.message,
        clientName: data.clientName,
        priority: data.priority,
        locale,
      })
    );

    const { data: resData, error } = await resend.emails.send({
      from: getFromEmail(locale, 'Soporte'),
      to: adminEmail,
      subject: `${t(locale, '[Nuevo Ticket]', '[New Ticket]')} ${data.subject} — ${data.clientName}`,
      html,
    });

    if (error) {
      throw error;
    }
    
    console.log(`[Email] New ticket email sent to admin successfully. MessageID: ${resData?.id}`);
  } catch (err) {
    console.error(`[Email] Error sending new ticket email to admin:`, err);
    throw err;
  }
}

export async function sendTicketReplyNotificationToClient(data: TicketEmailData & { replyMessage: string }, locale: string = 'es') {
  if (!data.clientEmail) return;

  console.log(`[Email] Preparing ticket reply email for client: ${data.clientEmail} (locale: ${locale})`);

  try {
    const html = await render(
      React.createElement(TicketNotificationEmail, {
        type: 'TICKET_REPLY',
        ticketId: data.ticketId,
        subject: data.subject,
        message: data.replyMessage,
        clientName: data.clientName,
        locale,
      })
    );

    const { data: resData, error } = await resend.emails.send({
      from: getFromEmail(locale, 'Soporte'),
      to: data.clientEmail,
      subject: `Re: ${data.subject} — Ticket #${data.ticketId.slice(-6).toUpperCase()}`,
      html,
    });

    if (error) {
      throw error;
    }

    console.log(`[Email] Reply email sent to client successfully. MessageID: ${resData?.id}`);
  } catch (err) {
    console.error(`[Email] Error sending reply email to client:`, err);
    throw err;
  }
}

export async function sendSecurityOtpEmail(email: string, code: string, userName: string, title: string, description: string, locale: string = 'es') {
  try {
    const html = await render(
      React.createElement(SecurityOtpEmail, {
        code,
        userName,
        title,
        description,
        locale,
      })
    );

    const { error } = await resend.emails.send({
      from: getFromEmail(locale, 'Seguridad'),
      to: email,
      subject: `[LAUNCHPAD] ${title}: ${code}`,
      html,
    });

    if (error) throw error;
  } catch (err) {
    console.error(`[Email] Error sending OTP email:`, err);
    throw err;
  }
}

export async function sendRemindersEmail(
  toEmail: string,
  userName: string,
  data: {
    tasks: any[];
    events: any[];
    vpsExpirations: any[];
    openTickets?: any[];
    expiringQuotes?: any[];
    failedActions?: any[];
  },
  locale: string = 'es'
) {
  try {
    const html = await render(
      React.createElement(RemindersEmail, {
        userName,
        data,
        locale,
      })
    );

    const { error } = await resend.emails.send({
      from: getFromEmail(locale, 'Portal'),
      to: toEmail,
      subject: `[LAUNCHPAD] ${t(locale, 'Resumen de Recordatorios', 'Reminders Summary')} — ${new Date().toLocaleDateString(locale)}`,
      html,
    });

    if (error) throw error;
  } catch (err) {
    console.error(`[Email] Error sending reminders email:`, err);
    throw err;
  }
}

// --- Calendar Notifications ---

export async function sendCalendarDailyDigest(
  toEmail: string,
  userName: string,
  events: any[],
  locale: string = 'es'
) {
  try {
    const html = await render(
      React.createElement(CalendarNotificationEmail, {
        type: 'daily_digest',
        userName,
        events,
        locale,
      })
    );
    const dateStr = new Date().toLocaleDateString(locale);
    const subject = `[LAUNCHPAD] ${t(locale, 'Resumen del día', "Today's Schedule")} — ${dateStr}`;

    const { error } = await resend.emails.send({
      from: getFromEmail(locale, 'Portal'),
      to: toEmail,
      subject,
      html,
    });
    if (error) throw error;
  } catch (err) {
    console.error(`[Email] Error sending daily digest:`, err);
    throw err;
  }
}

export async function sendCalendarTomorrowPreview(
  toEmail: string,
  userName: string,
  events: any[],
  locale: string = 'es'
) {
  try {
    const html = await render(
      React.createElement(CalendarNotificationEmail, {
        type: 'tomorrow_preview',
        userName,
        events,
        locale,
      })
    );
    const dateStr = new Date().toLocaleDateString(locale);
    const subject = `[LAUNCHPAD] ${t(locale, 'Eventos de mañana', "Tomorrow's Events")} — ${dateStr}`;

    const { error } = await resend.emails.send({
      from: getFromEmail(locale, 'Portal'),
      to: toEmail,
      subject,
      html,
    });
    if (error) throw error;
  } catch (err) {
    console.error(`[Email] Error sending tomorrow preview:`, err);
    throw err;
  }
}

export async function sendCalendarHourBeforeReminder(
  toEmail: string,
  userName: string,
  event: any,
  locale: string = 'es'
) {
  try {
    const html = await render(
      React.createElement(CalendarNotificationEmail, {
        type: 'hour_before',
        userName,
        event,
        locale,
      })
    );
    const subject = `[LAUNCHPAD] ⏰ ${event.title} — ${t(locale, 'en 1 hora', 'in 1 hour')}`;

    const { error } = await resend.emails.send({
      from: getFromEmail(locale, 'Portal'),
      to: toEmail,
      subject,
      html,
    });
    if (error) throw error;
  } catch (err) {
    console.error(`[Email] Error sending hour before reminder:`, err);
    throw err;
  }
}

export async function sendEventSharedNotification(
  toEmail: string,
  userName: string,
  sharedEvent: any,
  sharedByName: string,
  locale: string = 'es'
) {
  try {
    const html = await render(
      React.createElement(CalendarNotificationEmail, {
        type: 'event_shared',
        userName,
        sharedEvent,
        sharedByName,
        locale,
      })
    );
    const subject = `[LAUNCHPAD] ${sharedByName} ${t(locale, 'compartió un evento', 'shared an event')}`;

    const { error } = await resend.emails.send({
      from: getFromEmail(locale, 'Portal'),
      to: toEmail,
      subject,
      html,
    });
    if (error) throw error;
  } catch (err) {
    console.error(`[Email] Error sending event shared notification:`, err);
    throw err;
  }
}

export async function sendTaskAssignedNotification(
  toEmail: string,
  assigneeName: string,
  task: { title: string; priority: string; dueDate?: string },
  assignerName: string,
  locale: string = 'es'
) {
  try {
    const subject = `[LAUNCHPAD] ${t(
      locale,
      'Nueva tarea asignada',
      'New task assigned'
    )}: ${task.title}`;
    
    await resend.emails.send({
      from: getFromEmail(locale, 'Portal'),
      to: [toEmail],
      subject,
      react: TaskAssignedEmail({
        assigneeName,
        assignerName,
        taskTitle: task.title,
        taskPriority: task.priority,
        taskDueDate: task.dueDate,
        locale,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send task assigned notification email:', error);
    return { success: false, error };
  }
}

// Export resend instance in case it is needed somewhere else directly
export { resend };
