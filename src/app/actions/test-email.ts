'use server';

import { resend } from '@/lib/email';
import { StrategyAuditEmail } from '@/emails/StrategyAuditEmail';
import { render } from '@react-email/components';
import * as React from 'react';

export async function sendTestEmail(toEmail?: string) {
  const adminEmail = toEmail || process.env.ADMIN_EMAIL || process.env.USERM;

  if (!adminEmail) {
    return { error: 'Server configuration error' };
  }

  try {
    const html = await render(
      React.createElement(StrategyAuditEmail, {
        name: 'Test User',
        email: adminEmail,
        company: 'Test Company',
        challenge: 'This is a test message to verify the email functionality.',
      })
    );

    const { error } = await resend.emails.send({
      from: `"LAUNCHPAD Test" <${process.env.USERM || 'onboarding@resend.dev'}>`,
      to: adminEmail,
      subject: `[LAUNCHPAD] Test Email`,
      html,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[Test Email] Error sending test email:', error);
    return { error: 'Error sending message. Please try again.' };
  }
}
