import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('[Resend Webhook] Invalid JSON:', rawBody);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[Resend Webhook] Received payload:', JSON.stringify(payload, null, 2));

    const emailData = payload.type === 'email.received' ? payload.data : (payload.from ? payload : null);

    if (emailData) {
      const from = emailData.from || 'Unknown Sender';
      const to = Array.isArray(emailData.to) ? emailData.to.join(', ') : (emailData.to || 'Unknown Recipient');
      const subject = emailData.subject || 'No Subject';
      const messageId = emailData.message_id || emailData.messageId || null;
      
      let textBody = emailData.text || '';
      let htmlBody = emailData.html || '';

      // If text/html are empty, and we have an email_id, fetch the full email from Resend API
      const emailId = emailData.email_id || payload.email_id;
      if (emailId && (!textBody && !htmlBody)) {
        try {
          const fullEmail = await resend.emails.get(emailId);
          if (fullEmail.data) {
            textBody = fullEmail.data.text || textBody;
            htmlBody = fullEmail.data.html || htmlBody;
          }
        } catch (fetchErr) {
          console.error('[Resend Webhook] Failed to fetch full email body for ID', emailId, fetchErr);
        }
      }

      await prisma.emailMessage.create({
        data: {
          from,
          to,
          subject,
          textBody,
          htmlBody,
          direction: 'INBOUND',
          status: 'UNREAD',
          messageId
        }
      });

      console.log(`[Resend Webhook] Saved inbound email from ${from}`);
    } else {
      console.log('[Resend Webhook] Unhandled event type or missing email data.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
