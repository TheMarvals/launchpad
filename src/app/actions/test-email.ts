'use server';

import { getTransporter } from '@/lib/email';

export async function sendTestEmail(toEmail: string) {
  if (!toEmail || !toEmail.includes('@')) {
    return { error: 'Invalid email address' };
  }

  const logoUrl = process.env.CLOUDINARY_LOGO_URL ||
    (process.env.SITE_ORIGIN ? process.env.SITE_ORIGIN + '/lp_logo.png' : '/lp_logo.png');

  try {
    await getTransporter().sendMail({
      from: `"LAUNCHPAD Test" <${process.env.USERM}>`,
      to: toEmail,
      subject: `[LAUNCHPAD] Test Email — Logo Verification`,
      html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>LAUNCHPAD Test Email</title>
</head>
<body style="margin:0;padding:0;background:#131314;font-family:'Inter','Segoe UI',Arial,sans-serif;color:#e5e2e3;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#131314;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header with Logo -->
        <tr>
          <td style="padding:0 0 24px 0;text-align:center;">
            <img
              src="${logoUrl}"
              width="280"
              alt="LAUNCHPAD"
              style="display:block;margin:0 auto;max-width:100%;height:auto;"
            />
            <div style="width:32px;height:2px;background:#a855f7;margin:8px auto;"></div>
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:#8c90a2;font-weight:600;">by Masterminds</div>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:#1c1b1c;border:1px solid #424656;padding:32px;border-radius:8px;">
            <div style="margin-bottom:20px;">
              <span style="background:rgba(0,98,255,0.08);color:#0062ff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 10px;border:1px solid rgba(0,98,255,0.19);border-radius:4px;">
                📧 Test Email
              </span>
            </div>
            <h2 style="color:#e5e2e3;font-size:22px;font-weight:700;margin:0 0 12px 0;line-height:1.2;">Logo Verification</h2>
            <p style="color:#c2c6d9;font-size:14px;line-height:1.7;margin:0 0 16px 0;">
              This is a test email to verify that the LAUNCHPAD logo renders correctly.
            </p>
            <div style="background:#131314;border:1px solid #424656;padding:20px;border-radius:4px;">
              <div style="color:#8c90a2;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">Logo Source</div>
              <p style="color:#c2c6d9;font-size:12px;font-family:monospace;margin:0;word-break:break-all;">${logoUrl}</p>
            </div>
            <div style="margin-top:24px;padding-top:16px;border-top:1px solid #424656;">
              <table width="100%">
                <tr>
                  <td width="20" style="padding:0;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;"></span></td>
                  <td style="color:#c2c6d9;font-size:13px;">Logo visible in header above</td>
                </tr>
                <tr>
                  <td width="20" style="padding:8px 0 0 0;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;"></span></td>
                  <td style="color:#c2c6d9;font-size:13px;padding-top:8px;">Cloudinary CDN serving the image</td>
                </tr>
                <tr>
                  <td width="20" style="padding:8px 0 0 0;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;"></span></td>
                  <td style="color:#c2c6d9;font-size:13px;padding-top:8px;">If you see this email, the mailing system works</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0 0;text-align:center;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8c90a2;font-weight:600;">© 2026 LAUNCHPAD · by Masterminds</div>
            <div style="font-size:9px;color:#64748b;margin-top:6px;">This is an automated test message.</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    console.log(`[TestEmail] Test email sent successfully to ${toEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('[TestEmail] Error sending test email:', error);
    return { error: error.message || 'Failed to send test email' };
  }
}
