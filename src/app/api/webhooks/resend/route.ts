import { NextResponse } from 'next/server';
import { Resend, type EmailReceivedEvent } from 'resend';
import { prisma } from '@/lib/prisma';
import { notifyAdminsWithPermission } from '@/lib/push-notifications';

const resend = new Resend(process.env.RESEND_API_KEY);

function emailExcerpt(text: string) {
  const normalized = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

async function verifyWebhook(request: Request, rawBody: string) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_WEBHOOK_SECRET is not configured');
    }

    return JSON.parse(rawBody) as EmailReceivedEvent;
  }

  return resend.webhooks.verify({
    payload: rawBody,
    headers: {
      id: request.headers.get('svix-id') || '',
      timestamp: request.headers.get('svix-timestamp') || '',
      signature: request.headers.get('svix-signature') || '',
    },
    webhookSecret,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  let event;
  try {
    event = await verifyWebhook(request, rawBody);
  } catch (error) {
    console.error('[Resend Webhook] Verification failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ success: true, ignored: true });
  }

  const emailData = event.data;
  const providerEmailId = emailData.email_id;
  const messageId = emailData.message_id || null;

  try {
    const existingEmail = providerEmailId
      ? await prisma.emailMessage.findUnique({ where: { providerEmailId } })
      : messageId
        ? await prisma.emailMessage.findUnique({ where: { messageId } })
        : null;

    if (existingEmail) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const fullEmail = await resend.emails.receiving.get(providerEmailId);
    if (fullEmail.error) {
      throw new Error(fullEmail.error.message);
    }

    const from = emailData.from || 'Unknown Sender';
    const to = Array.isArray(emailData.to) ? emailData.to.join(', ') : 'Unknown Recipient';
    const subject = emailData.subject || 'No Subject';
    const textBody = fullEmail.data?.text || '';
    const htmlBody = fullEmail.data?.html || '';

    const email = await prisma.emailMessage.create({
      data: {
        from,
        to,
        subject,
        textBody,
        htmlBody,
        direction: 'INBOUND',
        status: 'UNREAD',
        messageId,
        providerEmailId,
        attachments: {
          create: (emailData.attachments || []).map((attachment) => ({
            filename: attachment.filename || 'attachment',
            contentType: attachment.content_type,
            sizeBytes: 0,
            providerAttachmentId: attachment.id,
          })),
        },
      },
    });

    await notifyAdminsWithPermission('emails', {
      title: `Nuevo correo: ${subject}`,
      body: `${from} · ${emailExcerpt(textBody || htmlBody || 'Nuevo mensaje recibido')}`,
      url: `/dashboard/emails/${email.id}`,
      tag: `email-${email.id}`,
    }).catch((error) => console.error('[Resend Webhook] Push notification failed:', error));

    console.log(`[Resend Webhook] Saved inbound email from ${from}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Resend Webhook] Error processing email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
