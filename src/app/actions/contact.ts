'use server';

import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/email';
import { StrategyAuditEmail } from '@/emails/StrategyAuditEmail';
import { render } from '@react-email/components';
import * as React from 'react';

export async function submitContactForm(data: {
  name: string;
  email: string;
  company: string;
  challenge: string;
  honeypot?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.USERM;

  if (!adminEmail) {
    return { error: 'Server configuration error' };
  }

  if (!data.name || !data.email || !data.company || !data.challenge) {
    return { error: 'All fields are required' };
  }

  // Honeypot check - if filled, it's a bot. Silently accept to trick the bot.
  if (data.honeypot) {
    console.warn(`[Contact] Blocked honeypot submission from: ${data.email}`);
    return { success: true };
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

    // Send email notification using Resend and React Email
    const html = await render(
      React.createElement(StrategyAuditEmail, {
        name: data.name,
        email: data.email,
        company: data.company,
        challenge: data.challenge,
      })
    );

    const { error } = await resend.emails.send({
      from: `"LAUNCHPAD Web" <${process.env.USERM || 'onboarding@resend.dev'}>`,
      to: adminEmail,
      subject: `[LAUNCHPAD] Strategy Audit Request from ${data.name} — ${data.company}`,
      html,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[Contact] Error sending contact email:', error);
    return { error: 'Error sending message. Please try again.' };
  }
}
