import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailReplyAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  content: Buffer;
}

function getReplySender(recipient: string) {
  const firstRecipient = recipient.split(',')[0]?.trim() || '';
  const emailMatch = firstRecipient.match(/<([^>]+)>/);
  let email = emailMatch?.[1] || firstRecipient;

  if (!email.includes('@')) {
    email = process.env.USERM || 'soporte@thelaunchpad.help';
  }

  const prefix = email.split('@')[0];
  const departmentName = prefix.charAt(0).toUpperCase() + prefix.slice(1);

  return {
    email,
    formatted: `LAUNCHPAD ${departmentName} <${email}>`,
  };
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

  const sender = getReplySender(originalEmail.to || '');
  const subject = originalEmail.subject?.toLowerCase().startsWith('re:')
    ? originalEmail.subject
    : `Re: ${originalEmail.subject || ''}`;

  const response = await resend.emails.send({
    from: sender.formatted,
    to: originalEmail.from,
    subject,
    text: replyBody,
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
        from: sender.email,
        to: originalEmail.from,
        subject,
        textBody: replyBody,
        direction: 'OUTBOUND',
        status: 'REPLIED',
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
