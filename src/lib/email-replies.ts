import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import {
  appendEmailSignature,
  findActiveSenderIdentity,
  formatSenderAddress,
} from '@/lib/email-sender-identities';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailReplyAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  content: Buffer;
}

export async function sendEmailReply(
  originalEmailId: string,
  replyBody: string,
  attachments: EmailReplyAttachment[] = [],
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
