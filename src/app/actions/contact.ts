'use server';

import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { revalidatePath } from 'next/cache';

function getTransporter() {
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

export async function submitContactForm(data: {
  name: string;
  email: string;
  company: string;
  challenge: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.USERM;

  if (!adminEmail) {
    return { error: 'Server configuration error' };
  }

  if (!data.name || !data.email || !data.company || !data.challenge) {
    return { error: 'All fields are required' };
  }

  try {
    // Save to database
    await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        challenge: data.challenge,
      },
    });

    // Send email notification
    await getTransporter().sendMail({
      from: `"LAUNCHPAD Web" <${process.env.USERM}>`,
      to: adminEmail,
      subject: `[LAUNCHPAD] Strategy Audit Request from ${data.name} — ${data.company}`,
      html: `
        <div style="background:#131314;padding:40px 16px;font-family:'Inter',Arial,sans-serif;">
          <table width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <div style="font-size:28px;font-weight:900;letter-spacing:-1.5px;color:transparent;font-family:'Outfit',sans-serif;text-transform:uppercase;-webkit-text-stroke:1.5px #ffffff;">LAUNCHPAD</div>
                <div style="width:32px;height:2px;background:#a855f7;margin:8px auto;"></div>
                <div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:#8c90a2;font-weight:600;">by Masterminds</div>
              </td>
            </tr>
            <tr>
              <td style="background:#1c1b1c;border:1px solid #424656;padding:32px;border-radius:8px;">
                <div style="margin-bottom:20px;">
                  <span style="background:rgba(168,85,247,0.1);color:#a855f7;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 10px;border:1px solid rgba(168,85,247,0.2);border-radius:4px;">📋 New Strategy Audit Request</span>
                </div>
                <p style="color:#c2c6d9;font-size:14px;line-height:1.6;margin:0 0 16px 0;">A new strategy audit request has been submitted through the landing page:</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #424656;">
                      <div style="color:#8c90a2;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Name</div>
                      <div style="color:#e5e2e3;font-size:14px;font-weight:600;margin-top:4px;">${data.name}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #424656;">
                      <div style="color:#8c90a2;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Corporate Email</div>
                      <div style="color:#e5e2e3;font-size:14px;font-weight:600;margin-top:4px;">${data.email}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #424656;">
                      <div style="color:#8c90a2;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Company</div>
                      <div style="color:#e5e2e3;font-size:14px;font-weight:600;margin-top:4px;">${data.company}</div>
                    </td>
                  </tr>
                </table>
                <div style="background:#131314;border:1px solid #424656;padding:20px;margin-top:16px;border-radius:4px;">
                  <div style="color:#8c90a2;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">Main Challenge</div>
                  <p style="color:#c2c6d9;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${data.challenge}</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Contact] Error sending contact email:', error);
    return { error: 'Error sending message. Please try again.' };
  }
}
