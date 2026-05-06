import nodemailer from 'nodemailer';

function getTransporter() {
  if (!process.env.HOSTM || !process.env.USERM || !process.env.PASSM) {
    console.error("[Email] Falta configuración SMTP en variables de entorno (HOSTM, USERM o PASSM).");
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

const priorityColor: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>MARVAL</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:0 0 32px 0;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-1.5px;color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;">MARVAL</div>
            <div style="width:40px;height:3px;background:#0f172a;margin:8px auto;"></div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#64748b;font-weight:700;">Gestión Integral</div>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:32px;padding:48px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:32px 0 0 0;text-align:center;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;font-weight:600;">© 2026 MARVAL · Excellence in Consulting</div>
            <div style="font-size:11px;color:#cbd5e1;margin-top:6px;">Este es un mensaje automático del sistema.</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Email para ADMIN cuando llega un nuevo ticket del cliente
export async function sendNewTicketNotificationToAdmin(data: TicketEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.USERM;
  if (!adminEmail) return;

  const priorityBadge = priorityLabel[data.priority] || data.priority;
  const badgeColor = priorityColor[data.priority] || '#6366f1';

  const content = `
    <div style="margin-bottom:24px;">
      <span style="background:#f1f5f9;color:#475569;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;border-radius:12px;border:1px solid #e2e8f0;">
        🎫 Nuevo Ticket
      </span>
    </div>
    <h2 style="color:#0f172a;font-size:24px;font-weight:800;margin:0 0 12px 0;line-height:1.2;">${data.subject}</h2>
    <div style="margin-bottom:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <span style="background:#f1f5f9;color:#64748b;font-size:11px;padding:4px 12px;border-radius:10px;border:1px solid #e2e8f0;font-weight:600;">👤 ${data.clientName}</span>
      <span style="background:${badgeColor}15;color:${badgeColor};font-size:11px;padding:4px 12px;border-radius:10px;border:1px solid ${badgeColor}30;font-weight:600;">${priorityBadge}</span>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:32px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:12px;font-weight:800;">Descripción del Problema</div>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin:0;">${data.message.replace(/\n/g, '<br>')}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://admin.themarvals.com/dashboard/tickets/${data.ticketId}" 
         style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
        Gestionar en el Portal →
      </a>
    </div>
  `;

  console.log(`[Email] Preparando correo de nuevo ticket para admin: ${adminEmail}`);

  try {
    const info = await getTransporter().sendMail({
      from: `"MARVAL Soporte" <${process.env.USERM}>`,
      to: adminEmail,
      subject: `[Nuevo Ticket] ${data.subject} — ${data.clientName}`,
      html: baseTemplate(content),
    });
    console.log(`[Email] Correo de nuevo ticket enviado al admin exitosamente. MessageID: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Error al enviar correo de nuevo ticket al admin:`, err);
    throw err;
  }
}

// Email para CLIENTE cuando el admin responde un ticket
export async function sendTicketReplyNotificationToClient(data: TicketEmailData & { replyMessage: string }) {
  if (!data.clientEmail) return;

  const content = `
    <div style="margin-bottom:24px;">
      <span style="background:#f1f5f9;color:#475569;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;border-radius:12px;border:1px solid #e2e8f0;">
        💬 Soporte MARVAL
      </span>
    </div>
    <p style="color:#475569;font-size:14px;margin:0 0 20px 0;">Hola <strong style="color:#0f172a;">${data.clientName}</strong>, el equipo de soporte ha respondido a tu ticket:</p>
    <h3 style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px 0;padding-bottom:12px;border-bottom:1px solid #f1f5f9;">📋 ${data.subject}</h3>
    <div style="background:#f0f9ff;border:1px solid #e0f2fe;border-radius:16px;padding:24px;margin-bottom:32px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#0369a1;margin-bottom:12px;font-weight:800;">Respuesta de MARVAL</div>
      <p style="color:#0c4a6e;font-size:15px;line-height:1.7;margin:0;">${data.replyMessage.replace(/\n/g, '<br>')}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://admin.themarvals.com/client-portal/tickets/${data.ticketId}" 
         style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
        Ver en el Portal de Cliente →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin:32px 0 0 0;text-align:center;">También puedes responder directamente desde tu portal de gestión.</p>
  `;

  console.log(`[Email] Preparando correo de respuesta de ticket para cliente: ${data.clientEmail}`);

  try {
    const info = await getTransporter().sendMail({
      from: `"MARVAL Soporte" <${process.env.USERM}>`,
      to: data.clientEmail,
      subject: `Re: ${data.subject} — Ticket #${data.ticketId.slice(-6).toUpperCase()}`,
      html: baseTemplate(content),
    });
    console.log(`[Email] Correo de respuesta enviado al cliente exitosamente. MessageID: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Error al enviar correo de respuesta al cliente:`, err);
    throw err;
  }
}

// Email genérico para OTPs de Seguridad (Login, Acciones de Servidor, etc.)
export async function sendSecurityOtpEmail(email: string, code: string, userName: string, title: string, description: string) {
  const content = `
    <div style="margin-bottom:24px;">
      <span style="background:#eef2ff;color:#4f46e5;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;border-radius:12px;border:1px solid #e0e7ff;">
        🔐 Seguridad
      </span>
    </div>
    <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 12px 0;">${title}</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      Hola <strong style="color:#0f172a;">${userName}</strong>,<br>
      ${description}
    </p>
    <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">Código de Acceso</div>
      <span style="font-family:monospace;font-size:36px;font-weight:900;letter-spacing:10px;color:#0f172a;">${code}</span>
    </div>
    <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">
      Este código expirará en 10 minutos por motivos de seguridad.
    </p>
  `;

  await getTransporter().sendMail({
    from: `"MARVAL Seguridad" <${process.env.USERM}>`,
    to: email,
    subject: `[MARVAL] ${title}: ${code}`,
    html: baseTemplate(content),
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
    margin-top: 24px;
    padding: 24px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
  `;

  if (data.vpsExpirations.length > 0) {
    remindersHtml += `
      <div style="${sectionStyle}">
        <h3 style="color:#ef4444;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px 0;font-weight:800;">💾 VPS por Vencer</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.vpsExpirations.map(v => `
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
                <div style="color:#0f172a;font-weight:700;font-size:14px;">${v.name}</div>
                <div style="color:#64748b;font-size:12px;">${v.client?.razonSocial || 'Cliente'} — Vence: ${v.dueDate ? new Date(v.dueDate).toLocaleDateString(locale) : 'N/A'}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (data.failedActions && data.failedActions.length > 0) {
    remindersHtml += `
      <div style="${sectionStyle} border-left: 4px solid #ef4444;">
        <h3 style="color:#ef4444;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px 0;font-weight:800;">⚠️ Alertas de Auditoría</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.failedActions.map(a => `
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
                <div style="color:#0f172a;font-weight:700;font-size:14px;">${a.action.toUpperCase()} fallido</div>
                <div style="color:#64748b;font-size:12px;">Servidor: ${a.server?.name || 'Desconocido'} — Por: ${a.user?.name || 'Sistema'}</div>
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
        <h3 style="color:#3b82f6;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px 0;font-weight:800;">✅ Tareas Pendientes</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.tasks.map(t => `
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
                <div style="color:#0f172a;font-weight:700;font-size:14px;">${t.title}</div>
                <div style="color:#64748b;font-size:12px;">Fecha límite: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString(locale) : 'N/A'}</div>
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
        <h3 style="color:#f59e0b;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px 0;font-weight:800;">🎫 Tickets de Soporte</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.openTickets.map(t => `
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
                <div style="color:#0f172a;font-weight:700;font-size:14px;">${t.subject}</div>
                <div style="color:#64748b;font-size:12px;">Cliente: ${t.client?.razonSocial || 'Desconocido'} — <span style="color:#f59e0b;font-weight:700;">${t.status}</span></div>
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
        <h3 style="color:#10b981;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px 0;font-weight:800;">📄 Cotizaciones Próximas</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.expiringQuotes.map(q => `
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
                <div style="color:#0f172a;font-weight:700;font-size:14px;">Cotización #${q.correlativo}</div>
                <div style="color:#64748b;font-size:12px;">Cliente: ${q.client?.razonSocial || 'Desconocido'} — Expira: ${new Date(q.fechaValidez).toLocaleDateString(locale)}</div>
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
        <h3 style="color:#a855f7;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px 0;font-weight:800;">📅 Agenda Semanal</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.events.map(e => `
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
                <div style="color:#0f172a;font-weight:700;font-size:14px;">${e.title}</div>
                <div style="color:#64748b;font-size:12px;">${new Date(e.start).toLocaleDateString(locale)} a las ${new Date(e.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  const content = `
    <div style="margin-bottom:24px;">
      <span style="background:#f1f5f9;color:#475569;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;border-radius:12px;border:1px solid #e2e8f0;">
        🚀 Resumen Ejecutivo
      </span>
    </div>
    <h2 style="color:#0f172a;font-size:24px;font-weight:800;margin:0 0 12px 0;">Hola ${userName},</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px 0;">
      Hemos consolidado los eventos y tareas críticas que requieren tu supervisión para esta semana:
    </p>
    ${remindersHtml}
    <div style="margin-top:40px;text-align:center;">
      <a href="https://admin.themarvals.com/dashboard/productivity/reminders" 
         style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:16px;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 10px 20px rgba(15,23,42,0.15);">
        Ir al Centro de Control
      </a>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"MARVAL Portal" <${process.env.USERM}>`,
    to: toEmail,
    subject: `[MARVAL] Resumen de Productividad — ${new Date().toLocaleDateString(locale)}`,
    html: baseTemplate(content),
  });
}

