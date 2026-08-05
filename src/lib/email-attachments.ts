import 'server-only';

export const MAX_EMAIL_FILES = 10;
export const MAX_EMAIL_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_EMAIL_TOTAL_SIZE = 25 * 1024 * 1024;
export const MAX_EMAIL_REQUEST_SIZE = 27 * 1024 * 1024;

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

export interface OutboundEmailAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  content: Buffer;
}

export class EmailAttachmentValidationError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = 'EmailAttachmentValidationError';
  }
}

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
    throw new EmailAttachmentValidationError(`Tipo de archivo no permitido: ${filename}`);
  }

  if (file.size > MAX_EMAIL_FILE_SIZE) {
    throw new EmailAttachmentValidationError(`${filename} supera el máximo de 10 MB`, 413);
  }

  return filename;
}

export function validateEmailRequestSize(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_EMAIL_REQUEST_SIZE) {
    throw new EmailAttachmentValidationError('El envío supera el máximo permitido de 25 MB', 413);
  }
}

export async function parseEmailAttachments(formData: FormData) {
  const files = formData
    .getAll('attachments')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_EMAIL_FILES) {
    throw new EmailAttachmentValidationError(`Puedes adjuntar un máximo de ${MAX_EMAIL_FILES} archivos`);
  }

  const totalSize = files.reduce((total, file) => total + file.size, 0);
  if (totalSize > MAX_EMAIL_TOTAL_SIZE) {
    throw new EmailAttachmentValidationError('Los adjuntos superan el máximo total de 25 MB', 413);
  }

  return Promise.all(files.map(async (file): Promise<OutboundEmailAttachment> => ({
    filename: validateFile(file),
    contentType: file.type,
    sizeBytes: file.size,
    content: Buffer.from(await file.arrayBuffer()),
  })));
}
