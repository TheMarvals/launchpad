import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmailReply } from '@/lib/email-replies';
import { isSameOriginRequest } from '@/lib/request-security';
import {
  EmailAttachmentValidationError,
  parseEmailAttachments,
  validateEmailRequestSize,
} from '@/lib/email-attachments';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  try {
    validateEmailRequestSize(request);
  } catch (error) {
    const validationError = error as EmailAttachmentValidationError;
    return NextResponse.json({ error: validationError.message }, { status: validationError.status });
  }

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const originalEmailId = formData.get('originalEmailId');
  const replyBody = formData.get('replyBody');

  if (typeof originalEmailId !== 'string' || !originalEmailId) {
    return NextResponse.json({ error: 'Missing original email' }, { status: 400 });
  }

  try {
    const attachments = await parseEmailAttachments(formData);

    if (typeof replyBody !== 'string' || (!replyBody.trim() && attachments.length === 0)) {
      return NextResponse.json({ error: 'Escribe una respuesta o adjunta un archivo' }, { status: 400 });
    }

    const result = await sendEmailReply(originalEmailId, replyBody.trim(), attachments);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar la respuesta';
    console.error('[Email Reply] Failed:', message);
    const status = error instanceof EmailAttachmentValidationError ? error.status : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
