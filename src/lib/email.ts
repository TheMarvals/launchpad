import { Resend } from 'resend';
import { render } from '@react-email/components';
import * as React from 'react';

// Email Templates
import TicketNotificationEmail from '../emails/TicketNotificationEmail';
import SecurityOtpEmail from '../emails/SecurityOtpEmail';
import RemindersEmail from '../emails/RemindersEmail';

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

// Export resend instance in case it is needed somewhere else directly
export { resend };
