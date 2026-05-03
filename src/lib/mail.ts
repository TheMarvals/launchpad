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
    // Evitar el error de "Host: mail.themarvals.com is not in the cert's altnames"
    // típico en hostings compartidos como cPanel o Namecheap.
    rejectUnauthorized: false
  }
});

export async function sendOtpEmail(to: string, code: string, action: string, serverName: string) {
  const actionText = action === 'start' ? 'Iniciar' : action === 'stop' ? 'Detener' : 'Reiniciar';
  const color = action === 'stop' ? '#dc2626' : action === 'start' ? '#16a34a' : '#2563eb';

  // Si no hay credenciales, imprimimos el código en consola para que puedas probar
  if (!process.env.HOSTM || !process.env.USERM || !process.env.PASSM) {
    console.log('\n=========================================');
    console.log(`[SIMULACIÓN DE CORREO] OTP PARA ${action.toUpperCase()} SERVIDOR ${serverName}`);
    console.log(`CÓDIGO OTP: ${code}`);
    console.log('=========================================\n');
    return { success: true };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a041a; color: white; padding: 40px; border-radius: 12px;">
      <h1 style="color: white; margin-top: 0; font-size: 28px; letter-spacing: -1px;">MARVAL <span style="color: #60a5fa; font-size: 14px; letter-spacing: 2px; vertical-align: middle;">CLOUD PORTAL</span></h1>
      
      <div style="background-color: white; color: #1f2937; padding: 30px; border-radius: 8px; margin-top: 30px;">
        <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Autorización de Acción Crítica</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Has solicitado <strong>${actionText}</strong> el servidor <strong style="color: #111827;">${serverName}</strong>. Para proceder de forma segura, ingresa el siguiente código de autorización temporal en el portal:</p>
        
        <div style="background-color: #f3f4f6; border-left: 4px solid ${color}; padding: 20px; margin: 30px 0; text-align: center; border-radius: 0 8px 8px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${color};">${code}</span>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Este código expirará en 10 minutos. Si no solicitaste esta acción, puedes ignorar este mensaje.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        &copy; ${new Date().getFullYear()} MARVAL Cloud Infrastructure. Todos los derechos reservados.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${process.env.NAMEM || 'MARVAL'}" <${process.env.USERM}>`,
      to,
      subject: `[MARVAL] Código OTP para ${actionText} servidor`,
      html,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error enviando correo OTP:', error);
    return { error: 'No se pudo enviar el correo de verificación' };
  }
}
