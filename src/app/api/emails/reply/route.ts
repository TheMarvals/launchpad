import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmailReply, type EmailReplyAttachment } from '@/lib/email-replies';
import { isSameOriginRequest } from '@/lib/request-security';

export const runtime = 'nodejs';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_REQUEST_SIZE = 27 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Map<string, Set<string>>([
  ['.png', new Set(['image/png'])],
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
  ['.gif', new Set(['image/gif'])],
  ['.webp', new Set(['image/webp'])],
  ['.pdf', new Set(['application/pdf'])],
  ['.doc', new Set(['application/msword', 'application/octet-stream'])],
  ['.docx', new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'])],
  ['.xls', new Set(['application/vnd.ms-excel', 'application/octet-stream'])],
  ['.xlsx', new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'])],
  ['.ppt', new Set(['application/vnd.ms-powerpoint', 'application/octet-stream'])],
  ['.pptx', new Set(['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'])],
  ['.csv', new Set(['text/csv', 'application/vnd.ms-excel', 'text/plain'])],
  ['.txt', new Set(['text/plain'])],
]);

function sanitizeFilename(filename: string) {
  const basename = filename.split(/[\\/]/).pop() || 'attachment';
  return basename.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 180) || 'attachment';
}

function getExtension(filename: string) {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
}

function validateFile(file: File) {
  const filename = sanitizeFilename(file.name);
  const extension = getExtension(filename);
  const allowedMimeTypes = ALLOWED_FILE_TYPES.get(extension);

  if (!allowedMimeTypes || !allowedMimeTypes.has(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${filename}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${filename} supera el máximo de 10 MB`);
  }

  return filename;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_SIZE) {
    return NextResponse.json({ error: 'El envío supera el máximo permitido de 25 MB' }, { status: 413 });
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
  const files = formData.getAll('attachments').filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (typeof originalEmailId !== 'string' || !originalEmailId) {
    return NextResponse.json({ error: 'Missing original email' }, { status: 400 });
  }

  if (typeof replyBody !== 'string' || (!replyBody.trim() && files.length === 0)) {
    return NextResponse.json({ error: 'Escribe una respuesta o adjunta un archivo' }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Puedes adjuntar un máximo de ${MAX_FILES} archivos` }, { status: 400 });
  }

  const totalSize = files.reduce((total, file) => total + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return NextResponse.json({ error: 'Los adjuntos superan el máximo total de 25 MB' }, { status: 413 });
  }

  try {
    const attachments: EmailReplyAttachment[] = await Promise.all(files.map(async (file) => ({
      filename: validateFile(file),
      contentType: file.type,
      sizeBytes: file.size,
      content: Buffer.from(await file.arrayBuffer()),
    })));

    const result = await sendEmailReply(originalEmailId, replyBody.trim(), attachments);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar la respuesta';
    console.error('[Email Reply] Failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
