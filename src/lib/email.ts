import nodemailer from 'nodemailer';

export function getTransporter() {
  if (!process.env.HOSTM || !process.env.USERM || !process.env.PASSM) {
    console.error("[Email] Missing SMTP configuration in environment variables (HOSTM, USERM or PASSM).");
  }
  return nodemailer.createTransport({
    host: process.env.HOSTM,
    port: 465,
    secure: true,
    auth: {
      user: process.env.USERM,
      pass: process.env.PASSM,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

interface TicketEmailData {
  ticketId: string;
  subject: string;
  priority: string;
  message: string;
  clientName: string;
  clientEmail: string;
  senderName: string;
  senderRole: string; // 'ADMIN' | 'CLIENT'
}

const priorityLabel: Record<string, string> = {
  LOW: '🟢 Baja',
  MEDIUM: '🟡 Media',
  HIGH: '🟠 Alta',
  URGENT: '🔴 Urgente',
};

const priorityLabelEn: Record<string, string> = {
  LOW: '🟢 Low',
  MEDIUM: '🟡 Medium',
  HIGH: '🟠 High',
  URGENT: '🔴 Urgent',
};

const priorityColor: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

// Design tokens — Kinetic Horizon / Modern Tech-Noir
const theme = {
  canvas: '#131314',
  elevated: '#1c1b1c',
  ink: '#e5e2e3',
  body: '#c2c6d9',
  muted: '#8c90a2',
  mutedSoft: '#64748b',
  hairline: '#424656',
  primary: '#0062ff',
  primaryHover: '#0053da',
  primaryActive: '#00dce5',
  secondary: '#a855f7',
  font: "'Inter', 'Segoe UI', Arial, sans-serif",
};

// Email locale translations
function t(locale: string, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function baseTemplate(content: string, locale: string = 'es') {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>LAUNCHPAD</title>
</head>
<body style="margin:0;padding:0;background:${theme.canvas};font-family:${theme.font};color:${theme.ink};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${theme.canvas};min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:0 0 24px 0;text-align:center;">
            <img
              src="${process.env.CLOUDINARY_LOGO_URL || (process.env.SITE_ORIGIN ? process.env.SITE_ORIGIN + '/lp_logo.png' : '/lp_logo.png')}"
              width="280"
              alt="LAUNCHPAD"
              style="display:block;margin:0 auto;max-width:100%;height:auto;"
            />
            <div style="width:32px;height:2px;background:${theme.secondary};margin:8px auto;"></div>
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:${theme.muted};font-weight:600;">by Masterminds</div>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:${theme.elevated};border:1px solid ${theme.hairline};padding:32px;border-radius:8px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0 0;text-align:center;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:${theme.muted};font-weight:600;">© 2026 LAUNCHPAD · by Masterminds</div>
            <div style="font-size:9px;color:${theme.mutedSoft};margin-top:6px;">${t(locale, 'Este es un mensaje automático del sistema.', 'This is an automated system message.')}</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Email para ADMIN cuando llega un nuevo ticket del cliente
export async function sendNewTicketNotificationToAdmin(data: TicketEmailData, locale: string = 'es') {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.USERM;
  if (!adminEmail) return;

  const badges = locale === 'en' ? priorityLabelEn : priorityLabel;
  const priorityBadge = badges[data.priority] || data.priority;
  const badgeColor = priorityColor[data.priority] || theme.primary;

  const content = `
    <div style="margin-bottom:24px;">
      <span style="background:${theme.primary}15;color:${theme.primary};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 10px;border:1px solid ${theme.primary}30;border-radius:4px;">
        🎫 ${t(locale, 'Nuevo Ticket', 'New Ticket')}
      </span>
    </div>
    <h2 style="color:${theme.ink};font-size:22px;font-weight:700;margin:0 0 12px 0;line-height:1.2;">${data.subject}</h2>
    <div style="margin-bottom:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <span style="color:${theme.body};font-size:12px;font-weight:500;padding:4px 10px;border:1px solid ${theme.hairline};border-radius:4px;">👤 ${data.clientName}</span>
      <span style="color:${badgeColor};font-size:11px;font-weight:600;padding:4px 10px;border:1px solid ${badgeColor}40;border-radius:4px;">${priorityBadge}</span>
    </div>
    <div style="background:${theme.canvas};border:1px solid ${theme.hairline};padding:24px;margin-bottom:24px;border-radius:4px;">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:${theme.muted};margin-bottom:8px;font-weight:700;">${t(locale, 'Descripción del Problema', 'Problem Description')}</div>
      <p style="color:${theme.body};font-size:14px;line-height:1.7;margin:0;">${data.message.replace(/\n/g, '<br>')}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://admin.themarvals.com/dashboard/tickets/${data.ticketId}" 
         style="display:inline-block;background:${theme.primary};color:#f3f3ff;text-decoration:none;padding:12px 28px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-radius:4px;">
        ${t(locale, 'Gestionar en el Portal →', 'Manage in Portal →')}
      </a>
    </div>
  `;

  console.log(`[Email] Preparing new ticket email for admin: ${adminEmail} (locale: ${locale})`);

  try {
    const info = await getTransporter().sendMail({
      from: `"LAUNCHPAD ${t(locale, 'Soporte', 'Support')}" <${process.env.USERM}>`,
      to: adminEmail,
      subject: `${t(locale, '[Nuevo Ticket]', '[New Ticket]')} ${data.subject} — ${data.clientName}`,
      html: baseTemplate(content, locale),
    });
    console.log(`[Email] New ticket email sent to admin successfully. MessageID: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Error sending new ticket email to admin:`, err);
    throw err;
  }
}

// Email para CLIENTE cuando el admin responde un ticket
export async function sendTicketReplyNotificationToClient(data: TicketEmailData & { replyMessage: string }, locale: string = 'es') {
  if (!data.clientEmail) return;

  const content = `
    <div style="margin-bottom:20px;">
      <span style="background:${theme.secondary}12;color:${theme.secondary};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 10px;border:1px solid ${theme.secondary}28;border-radius:4px;">
        💬 ${t(locale, 'Soporte LAUNCHPAD', 'LAUNCHPAD Support')}
      </span>
    </div>
    <p style="color:${theme.body};font-size:14px;margin:0 0 16px 0;">${t(locale, 'Hola', 'Hello')} <strong style="color:${theme.ink};">${data.clientName}</strong>, ${t(locale, 'el equipo de soporte ha respondido a tu ticket:', 'the support team has replied to your ticket:')}</p>
    <h3 style="color:${theme.ink};font-size:15px;font-weight:600;margin:0 0 16px 0;padding-bottom:12px;border-bottom:1px solid ${theme.hairline};">📋 ${data.subject}</h3>
    <div style="background:${theme.canvas};border:1px solid ${theme.hairline};padding:24px;margin-bottom:24px;border-radius:4px;">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:${theme.secondary};margin-bottom:8px;font-weight:700;">${t(locale, 'Respuesta de LAUNCHPAD', 'LAUNCHPAD Response')}</div>
      <p style="color:${theme.body};font-size:14px;line-height:1.7;margin:0;">${data.replyMessage.replace(/\n/g, '<br>')}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://admin.themarvals.com/client-portal/tickets/${data.ticketId}" 
         style="display:inline-block;background:${theme.primary};color:#f3f3ff;text-decoration:none;padding:12px 28px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-radius:4px;">
        ${t(locale, 'Ver en el Portal de Cliente →', 'View in Client Portal →')}
      </a>
    </div>
    <p style="color:${theme.mutedSoft};font-size:11px;margin:24px 0 0 0;text-align:center;">${t(locale, 'También puedes responder directamente desde tu portal de gestión.', 'You can also reply directly from your management portal.')}</p>
  `;

  console.log(`[Email] Preparing ticket reply email for client: ${data.clientEmail} (locale: ${locale})`);

  try {
    const info = await getTransporter().sendMail({
      from: `"LAUNCHPAD ${t(locale, 'Soporte', 'Support')}" <${process.env.USERM}>`,
      to: data.clientEmail,
      subject: `Re: ${data.subject} — Ticket #${data.ticketId.slice(-6).toUpperCase()}`,
      html: baseTemplate(content, locale),
    });
    console.log(`[Email] Reply email sent to client successfully. MessageID: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Error sending reply email to client:`, err);
    throw err;
  }
}

// Email genérico para OTPs de Seguridad (Login, Acciones de Servidor, etc.)
export async function sendSecurityOtpEmail(email: string, code: string, userName: string, title: string, description: string, locale: string = 'es') {
  const content = `
    <div style="margin-bottom:20px;">
      <span style="background:${theme.primary}12;color:${theme.primary};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 10px;border:1px solid ${theme.primary}28;border-radius:4px;">
        🔐 ${t(locale, 'Seguridad', 'Security')}
      </span>
    </div>
    <h2 style="color:${theme.ink};font-size:20px;font-weight:600;margin:0 0 8px 0;">${title}</h2>
    <p style="color:${theme.body};font-size:14px;line-height:1.6;margin:0 0 20px 0;">
      ${t(locale, 'Hola', 'Hello')} <strong style="color:${theme.ink};">${userName}</strong>,<br>
      ${description}
    </p>
    <div style="background:${theme.canvas};border:1px solid ${theme.hairline};padding:28px;text-align:center;margin-bottom:20px;border-radius:4px;">
      <div style="color:${theme.muted};font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">${t(locale, 'Código de Acceso', 'Access Code')}</div>
      <span style="font-family:monospace;font-size:34px;font-weight:800;letter-spacing:10px;color:${theme.ink};">${code}</span>
    </div>
    <p style="color:${theme.mutedSoft};font-size:11px;line-height:1.5;margin:0;">
      ${t(locale, 'Este código expirará en 10 minutos por motivos de seguridad.', 'This code will expire in 10 minutes for security reasons.')}
    </p>
  `;

  await getTransporter().sendMail({
    from: `"LAUNCHPAD ${t(locale, 'Seguridad', 'Security')}" <${process.env.USERM}>`,
    to: email,
    subject: `[LAUNCHPAD] ${title}: ${code}`,
    html: baseTemplate(content, locale),
  });
}

// Email de Resumen de Recordatorios (Productividad)
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
  let remindersHtml = '';

  const sectionStyle = `
    margin-top: 20px;
    padding: 20px;
    background: ${theme.canvas};
    border: 1px solid ${theme.hairline};
    border-radius: 4px;
  `;

  if (data.vpsExpirations.length > 0) {
    remindersHtml += `
      <div style="${sectionStyle}">
        <h3 style="color:${theme.secondary};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">💾 ${t(locale, 'VPS por Vencer', 'VPS Expiring Soon')}</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.vpsExpirations.map(v => `
            <tr>
              <td style="padding:8px 0; border-bottom:1px solid ${theme.hairline};">
                <div style="color:${theme.ink};font-weight:600;font-size:14px;">${v.name}</div>
                <div style="color:${theme.muted};font-size:12px;">${v.client?.razonSocial || t(locale, 'Cliente', 'Client')} — ${t(locale, 'Vence:', 'Expires:')} ${v.dueDate ? new Date(v.dueDate).toLocaleDateString(locale) : 'N/A'}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (data.failedActions && data.failedActions.length > 0) {
    remindersHtml += `
      <div style="${sectionStyle} border-left: 3px solid ${theme.primary};">
        <h3 style="color:${theme.primary};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">⚠️ ${t(locale, 'Alertas de Auditoría', 'Audit Alerts')}</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.failedActions.map(a => `
            <tr>
              <td style="padding:8px 0; border-bottom:1px solid ${theme.hairline};">
                <div style="color:${theme.ink};font-weight:600;font-size:14px;">${a.action.toUpperCase()} ${t(locale, 'fallido', 'failed')}</div>
                <div style="color:${theme.muted};font-size:12px;">${t(locale, 'Servidor:', 'Server:')} ${a.server?.name || t(locale, 'Desconocido', 'Unknown')} — ${t(locale, 'Por:', 'By:')} ${a.user?.name || t(locale, 'Sistema', 'System')}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (data.tasks.length > 0) {
    remindersHtml += `
      <div style="${sectionStyle}">
        <h3 style="color:${theme.secondary};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">✅ ${t(locale, 'Tareas Pendientes', 'Pending Tasks')}</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.tasks.map(t => `
            <tr>
              <td style="padding:8px 0; border-bottom:1px solid ${theme.hairline};">
                <div style="color:${theme.ink};font-weight:600;font-size:14px;">${t.title}</div>
                <div style="color:${theme.muted};font-size:12px;">${t(locale, 'Fecha límite:', 'Due:')} ${t.dueDate ? new Date(t.dueDate).toLocaleDateString(locale) : 'N/A'}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (data.openTickets && data.openTickets.length > 0) {
    remindersHtml += `
      <div style="${sectionStyle}">
        <h3 style="color:${theme.secondary};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">🎫 ${t(locale, 'Tickets de Soporte', 'Support Tickets')}</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.openTickets.map(t => `
            <tr>
              <td style="padding:8px 0; border-bottom:1px solid ${theme.hairline};">
                <div style="color:${theme.ink};font-weight:600;font-size:14px;">${t.subject}</div>
                <div style="color:${theme.muted};font-size:12px;">${t(locale, 'Cliente:', 'Client:')} ${t.client?.razonSocial || t(locale, 'Desconocido', 'Unknown')} — <span style="color:${theme.primary};font-weight:600;">${t.status}</span></div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (data.expiringQuotes && data.expiringQuotes.length > 0) {
    remindersHtml += `
      <div style="${sectionStyle}">
        <h3 style="color:${theme.secondary};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">📄 ${t(locale, 'Cotizaciones Próximas', 'Expiring Quotes')}</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.expiringQuotes.map(q => `
            <tr>
              <td style="padding:8px 0; border-bottom:1px solid ${theme.hairline};">
                <div style="color:${theme.ink};font-weight:600;font-size:14px;">${t(locale, 'Cotización', 'Quote')} #${q.correlativo}</div>
                <div style="color:${theme.muted};font-size:12px;">${t(locale, 'Cliente:', 'Client:')} ${q.client?.razonSocial || t(locale, 'Desconocido', 'Unknown')} — ${t(locale, 'Expira:', 'Expires:')} ${new Date(q.fechaValidez).toLocaleDateString(locale)}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (data.events.length > 0) {
    remindersHtml += `
      <div style="${sectionStyle}">
        <h3 style="color:${theme.secondary};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px 0;font-weight:700;">📅 ${t(locale, 'Agenda Semanal', 'Weekly Agenda')}</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.events.map(e => `
            <tr>
              <td style="padding:8px 0; border-bottom:1px solid ${theme.hairline};">
                <div style="color:${theme.ink};font-weight:600;font-size:14px;">${e.title}</div>
                <div style="color:${theme.muted};font-size:12px;">${new Date(e.start).toLocaleDateString(locale)} ${t(locale, 'a las', 'at')} ${new Date(e.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  const content = `
    <div style="margin-bottom:20px;">
      <span style="background:${theme.secondary}12;color:${theme.secondary};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 10px;border:1px solid ${theme.secondary}28;border-radius:4px;">
        🚀 ${t(locale, 'Resumen Ejecutivo', 'Executive Summary')}
      </span>
    </div>
    <h2 style="color:${theme.ink};font-size:22px;font-weight:600;margin:0 0 8px 0;">${t(locale, 'Hola', 'Hello')} ${userName},</h2>
    <p style="color:${theme.body};font-size:14px;line-height:1.6;margin:0 0 8px 0;">
      ${t(locale, 'Hemos consolidado los eventos y tareas críticas que requieren tu supervisión para esta semana:', 'We have consolidated the critical events and tasks that require your attention this week:')}
    </p>
    ${remindersHtml}
    <div style="margin-top:32px;text-align:center;">
      <a href="https://admin.themarvals.com/dashboard/productivity/reminders" 
         style="display:inline-block;background:${theme.primary};color:#f3f3ff;text-decoration:none;padding:14px 32px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-radius:4px;">
        ${t(locale, 'Ir al Centro de Control', 'Go to Control Center')}
      </a>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"LAUNCHPAD ${t(locale, 'Portal', 'Portal')}" <${process.env.USERM}>`,
    to: toEmail,
    subject: `[LAUNCHPAD] ${t(locale, 'Resumen de Recordatorios', 'Reminders Summary')} — ${new Date().toLocaleDateString(locale)}`,
    html: baseTemplate(content, locale),
  });
}
