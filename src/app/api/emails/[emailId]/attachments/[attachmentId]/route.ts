import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ emailId: string; attachmentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true, isActive: true },
  });

  if (!dbUser?.isActive || dbUser.role !== 'ADMIN' || !dbUser.permissions.includes('emails')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { emailId, attachmentId } = await params;
  const attachment = await prisma.emailAttachment.findFirst({
    where: {
      id: attachmentId,
      emailMessageId: emailId,
    },
    include: { emailMessage: true },
  });

  if (!attachment?.providerAttachmentId || !attachment.emailMessage.providerEmailId) {
    return NextResponse.json({ error: 'Attachment is not available for download' }, { status: 404 });
  }

  const options = {
    emailId: attachment.emailMessage.providerEmailId,
    id: attachment.providerAttachmentId,
  };

  const result = attachment.emailMessage.direction === 'INBOUND'
    ? await resend.emails.receiving.attachments.get(options)
    : await resend.emails.attachments.get(options);

  if (result.error || !result.data?.download_url) {
    return NextResponse.json({ error: result.error?.message || 'Attachment download failed' }, { status: 502 });
  }

  return NextResponse.redirect(result.data.download_url);
}
