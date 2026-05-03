import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
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
<body style="margin:0;padding:0;background:#0a041a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a041a;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:0 0 32px 0;text-align:center;">
            <div style="font-size:32px;font-weight:900;letter-spacing:-2px;color:transparent;-webkit-text-stroke:1.5px #ffffff;font-family:'Segoe UI',Arial,sans-serif;">MARVAL</div>
            <div style="width:48px;height:2px;background:#3b82f6;margin:8px auto;"></div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:4px;color:#64748b;font-weight:700;">Portal de Gestión Integral</div>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0 0;text-align:center;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#334155;">© 2026 MARVAL · Todos los derechos reservados</div>
            <div style="font-size:10px;color:#334155;margin-top:4px;">admin.themarvals.com</div>
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
  const adminEmail = process.env.USERM;
  if (!adminEmail) return;

  const priorityBadge = priorityLabel[data.priority] || data.priority;
  const badgeColor = priorityColor[data.priority] || '#6366f1';

  const content = `
    <div style="margin-bottom:24px;">
      <span style="background:rgba(59,130,246,0.15);color:#3b82f6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;padding:4px 12px;border-radius:20px;border:1px solid rgba(59,130,246,0.2);">
        🎫 Nuevo Ticket de Soporte
      </span>
    </div>
    <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 8px 0;line-height:1.3;">${data.subject}</h2>
    <div style="margin-bottom:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <span style="background:rgba(255,255,255,0.05);color:#94a3b8;font-size:11px;padding:3px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);">👤 ${data.clientName}</span>
      <span style="background:${badgeColor}20;color:${badgeColor};font-size:11px;padding:3px 10px;border-radius:10px;border:1px solid ${badgeColor}40;">Prioridad: ${priorityBadge}</span>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:28px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-bottom:10px;font-weight:700;">Mensaje inicial</div>
      <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">${data.message.replace(/\n/g, '<br>')}</p>
    </div>
    <a href="https://admin.themarvals.com/dashboard/tickets/${data.ticketId}" 
       style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
      Ver Ticket →
    </a>
  `;

  await transporter.sendMail({
    from: `"MARVAL Soporte" <${process.env.USERM}>`,
    to: adminEmail,
    subject: `[Nuevo Ticket] ${data.subject} — ${data.clientName}`,
    html: baseTemplate(content),
  });
}

// Email para CLIENTE cuando el admin responde un ticket
export async function sendTicketReplyNotificationToClient(data: TicketEmailData & { replyMessage: string }) {
  if (!data.clientEmail) return;

  const content = `
    <div style="margin-bottom:24px;">
      <span style="background:rgba(99,102,241,0.15);color:#818cf8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;padding:4px 12px;border-radius:20px;border:1px solid rgba(99,102,241,0.2);">
        💬 Respuesta a tu Ticket
      </span>
    </div>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 20px 0;">Hola <strong style="color:#ffffff;">${data.clientName}</strong>, el equipo de soporte de MARVAL ha respondido a tu ticket:</p>
    <h3 style="color:#ffffff;font-size:16px;font-weight:700;margin:0 0 16px 0;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);">📋 ${data.subject}</h3>
    <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:20px;margin-bottom:28px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#818cf8;margin-bottom:10px;font-weight:700;">Respuesta del equipo MARVAL</div>
      <p style="color:#e2e8f0;font-size:14px;line-height:1.7;margin:0;">${data.replyMessage.replace(/\n/g, '<br>')}</p>
    </div>
    <a href="https://admin.themarvals.com/client-portal/tickets/${data.ticketId}" 
       style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
      Ver Conversación →
    </a>
    <p style="color:#475569;font-size:12px;margin:24px 0 0 0;">Si tienes alguna duda adicional, puedes responder directamente desde el portal.</p>
  `;

  await transporter.sendMail({
    from: `"MARVAL Soporte" <${process.env.USERM}>`,
    to: data.clientEmail,
    subject: `Re: ${data.subject} — Ticket #${data.ticketId.slice(-6).toUpperCase()}`,
    html: baseTemplate(content),
  });
}

// Email para el flujo de Login OTP (2-Step Verification)
export async function sendLoginOtpEmail(email: string, code: string, userName: string) {
  const content = `
    <div style="margin-bottom:24px;">
      <span style="background:rgba(99,102,241,0.15);color:#818cf8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;padding:4px 12px;border-radius:20px;border:1px solid rgba(99,102,241,0.2);">
        🔐 Verificación de Seguridad
      </span>
    </div>
    <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 16px 0;">Código de Acceso</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      Hola <strong style="color:#ffffff;">${userName}</strong>,<br>
      Se ha detectado un intento de inicio de sesión en tu cuenta. Usa el siguiente código para completar el proceso:
    </p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <span style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#3b82f6;">${code}</span>
    </div>
    <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0;">
      Este código expirará en 10 minutos. Si no solicitaste este acceso, por favor ignora este correo y asegúrate de que tu contraseña sea segura.
    </p>
  `;

  await transporter.sendMail({
    from: `"MARVAL Seguridad" <${process.env.USERM}>`,
    to: email,
    subject: `Tu código de acceso: ${code}`,
    html: baseTemplate(content),
  });
}
