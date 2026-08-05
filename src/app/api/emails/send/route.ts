import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendNewEmail } from '@/lib/email-replies';
import { normalizeEmailRecipients } from '@/lib/email-recipients';
import { isSameOriginRequest } from '@/lib/request-security';
import {
  EmailAttachmentValidationError,
  parseEmailAttachments,
  validateEmailRequestSize,
} from '@/lib/email-attachments';

export const runtime = 'nodejs';

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const senderIdentityId = formData.get('senderIdentityId');
  const toValue = formData.get('to');
  const ccValue = formData.get('cc');
  const bccValue = formData.get('bcc');
  const subjectValue = formData.get('subject');
  const bodyValue = formData.get('body');
  const requestId = formData.get('requestId');

  if (typeof senderIdentityId !== 'string' || !senderIdentityId) {
    return NextResponse.json({ error: 'Selecciona un remitente' }, { status: 400 });
  }

  if (typeof requestId !== 'string' || !REQUEST_ID_PATTERN.test(requestId)) {
    return NextResponse.json({ error: 'Identificador de envío inválido' }, { status: 400 });
  }

  if (typeof subjectValue !== 'string' || !subjectValue.trim()) {
    return NextResponse.json({ error: 'Escribe un asunto' }, { status: 400 });
  }

  if (subjectValue.trim().length > 200) {
    return NextResponse.json({ error: 'El asunto no puede superar los 200 caracteres' }, { status: 400 });
  }

  if (typeof bodyValue !== 'string' || !bodyValue.trim()) {
    return NextResponse.json({ error: 'Escribe el contenido del correo' }, { status: 400 });
  }

  if (bodyValue.length > 100_000) {
    return NextResponse.json({ error: 'El contenido del correo es demasiado extenso' }, { status: 400 });
  }

  try {
    const recipients = normalizeEmailRecipients({
      to: typeof toValue === 'string' ? toValue : '',
      cc: typeof ccValue === 'string' ? ccValue : '',
      bcc: typeof bccValue === 'string' ? bccValue : '',
    });
    const attachments = await parseEmailAttachments(formData);
    const result = await sendNewEmail({
      senderIdentityId,
      ...recipients,
      subject: subjectValue.trim(),
      body: bodyValue.trim(),
      requestId,
    }, attachments);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar el correo';
    const status = error instanceof EmailAttachmentValidationError ? error.status : 400;
    console.error('[New Email] Failed:', message);
    return NextResponse.json({ error: message }, { status });
  }
}
