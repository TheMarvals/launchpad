import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import {
  appendEmailSignature,
  findActiveSenderIdentity,
  formatSenderAddress,
} from '@/lib/email-sender-identities';
import type { OutboundEmailAttachment } from '@/lib/email-attachments';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailReply(
  originalEmailId: string,
  replyBody: string,
  attachments: OutboundEmailAttachment[] = [],
) {
  const originalEmail = await prisma.emailMessage.findUnique({
    where: { id: originalEmailId },
  });

  if (!originalEmail) throw new Error('Original email not found');
  if (originalEmail.direction !== 'INBOUND') throw new Error('Only inbound emails can be replied to');

  const sender = await findActiveSenderIdentity(originalEmail.to || '');
  if (!sender) {
    throw new Error(`No hay un remitente activo configurado para ${originalEmail.to}`);
  }

  const finalReplyBody = appendEmailSignature(replyBody, sender.signature);
  const subject = originalEmail.subject?.toLowerCase().startsWith('re:')
    ? originalEmail.subject
    : `Re: ${originalEmail.subject || ''}`;

  const response = await resend.emails.send({
    from: formatSenderAddress(sender.displayName, sender.email),
    to: originalEmail.from,
    replyTo: sender.email,
    subject,
    text: finalReplyBody,
    headers: originalEmail.messageId
      ? {
          'In-Reply-To': originalEmail.messageId,
          References: originalEmail.messageId,
        }
      : undefined,
    attachments: attachments.length > 0
      ? attachments.map((attachment) => ({
          filename: attachment.filename,
          contentType: attachment.contentType,
          content: attachment.content,
        }))
      : undefined,
    tags: [
      { name: 'category', value: 'platform_reply' },
      {
        name: 'sender',
        value: sender.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256),
      },
    ],
  });

  if (response.error || !response.data) {
    throw new Error(`Failed to send reply: ${response.error?.message || 'Unknown Resend error'}`);
  }

  const providerEmailId = response.data.id;
  const providerAttachmentResponse = attachments.length > 0
    ? await resend.emails.attachments.list({ emailId: providerEmailId }).catch(() => null)
    : null;
  const providerAttachments = providerAttachmentResponse?.data?.data ?? [];

  const outboundEmail = await prisma.$transaction(async (transaction) => {
    const createdEmail = await transaction.emailMessage.create({
      data: {
        senderIdentityId: sender.id,
        from: sender.email,
        to: originalEmail.from,
        subject,
        textBody: finalReplyBody,
        direction: 'OUTBOUND',
        status: 'REPLIED',
        deliveryStatus: 'SENT',
        deliveryUpdatedAt: new Date(),
        providerEmailId,
        attachments: {
          create: attachments.map((attachment, index) => ({
            filename: attachment.filename,
            contentType: attachment.contentType,
            sizeBytes: attachment.sizeBytes,
            providerAttachmentId: providerAttachments[index]?.id,
          })),
        },
      },
    });

    await transaction.emailMessage.update({
      where: { id: originalEmailId },
      data: { status: 'REPLIED' },
    });

    return createdEmail;
  });

  return { success: true, emailId: outboundEmail.id };
}

export interface NewEmailInput {
  senderIdentityId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  requestId: string;
}

export async function sendNewEmail(
  input: NewEmailInput,
  attachments: OutboundEmailAttachment[] = [],
) {
  const sender = await prisma.emailSenderIdentity.findFirst({
    where: {
      id: input.senderIdentityId,
      isActive: true,
    },
  });

  if (!sender) {
    throw new Error('La identidad de remitente no existe o está inactiva');
  }

  const finalBody = appendEmailSignature(input.body, sender.signature);
  const response = await resend.emails.send({
    from: formatSenderAddress(sender.displayName, sender.email),
    to: input.to,
    cc: input.cc.length > 0 ? input.cc : undefined,
    bcc: input.bcc.length > 0 ? input.bcc : undefined,
    replyTo: sender.email,
    subject: input.subject,
    text: finalBody,
    attachments: attachments.length > 0
      ? attachments.map((attachment) => ({
          filename: attachment.filename,
          contentType: attachment.contentType,
          content: attachment.content,
        }))
      : undefined,
    tags: [
      { name: 'category', value: 'platform_new_email' },
      {
        name: 'sender',
        value: sender.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256),
      },
    ],
  }, {
    idempotencyKey: `compose/${input.requestId}`,
  });

  if (response.error || !response.data) {
    throw new Error(`No se pudo enviar el correo: ${response.error?.message || 'Error desconocido de Resend'}`);
  }

  const providerEmailId = response.data.id;
  const providerAttachmentResponse = attachments.length > 0
    ? await resend.emails.attachments.list({ emailId: providerEmailId }).catch(() => null)
    : null;
  const providerAttachments = providerAttachmentResponse?.data?.data ?? [];

  const outboundEmail = await prisma.emailMessage.upsert({
    where: { providerEmailId },
    create: {
      senderIdentityId: sender.id,
      from: sender.email,
      to: input.to.join(', '),
      cc: input.cc.length > 0 ? input.cc.join(', ') : null,
      bcc: input.bcc.length > 0 ? input.bcc.join(', ') : null,
      subject: input.subject,
      textBody: finalBody,
      direction: 'OUTBOUND',
      status: 'SENT',
      deliveryStatus: 'SENT',
      deliveryUpdatedAt: new Date(),
      providerEmailId,
      attachments: {
        create: attachments.map((attachment, index) => ({
          filename: attachment.filename,
          contentType: attachment.contentType,
          sizeBytes: attachment.sizeBytes,
          providerAttachmentId: providerAttachments[index]?.id,
        })),
      },
    },
    update: {},
  });

  return { success: true, emailId: outboundEmail.id };
}
