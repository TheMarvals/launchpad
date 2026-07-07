import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

    // Optional: Verify signature if you set a webhook secret in Resend
    // Not implemented here for simplicity, but recommended for production.

    // Resend inbound webhook data structure differs slightly from event structure
    // But typically it comes as the main payload or under payload.data
    // Inbound webhooks may be different from generic event webhooks.
    
    // Check if it's an email received event (could be directly the email object if using pure inbound, or wrapped in an event)
    const emailData = payload.type === 'email.received' ? payload.data : (payload.from ? payload : null);

    if (emailData) {
      const from = emailData.from || 'Unknown Sender';
      const to = Array.isArray(emailData.to) ? emailData.to.join(', ') : (emailData.to || 'Unknown Recipient');
      const subject = emailData.subject || 'No Subject';
      const textBody = emailData.text || '';
      const htmlBody = emailData.html || '';
      // Sometimes messageId is message_id or inside headers
      const messageId = emailData.message_id || emailData.messageId || null;

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
