import 'server-only';

import { prisma } from '@/lib/prisma';

export interface EmailSenderIdentityInput {
  email: string;
  displayName: string;
  signature: string;
  isActive: boolean;
}

export function extractEmailAddresses(value: string) {
  const matches = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return [...new Set(matches.map((email) => email.toLowerCase()))];
}

export function getSenderDomain() {
  const configuredAddress = process.env.EMAIL_SENDER_DOMAIN
    || extractEmailAddresses(process.env.USERM || '')[0]?.split('@')[1]
    || 'thelaunchpad.help';

  return configuredAddress.trim().toLowerCase().replace(/^@/, '');
}

export function validateSenderIdentityInput(input: EmailSenderIdentityInput) {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const signature = input.signature.trim();
  const addresses = extractEmailAddresses(email);
  const allowedDomain = getSenderDomain();

  if (addresses.length !== 1 || addresses[0] !== email) {
    throw new Error('Ingresa una dirección de correo válida');
  }

  if (!email.endsWith(`@${allowedDomain}`)) {
    throw new Error(`El remitente debe pertenecer a @${allowedDomain}`);
  }

  if (displayName.length < 2 || displayName.length > 100) {
    throw new Error('El nombre visible debe tener entre 2 y 100 caracteres');
  }

  if (signature.length > 2000) {
    throw new Error('La firma no puede superar los 2000 caracteres');
  }

  return {
    email,
    displayName,
    signature,
    isActive: Boolean(input.isActive),
  };
}

export async function findActiveSenderIdentity(recipientHeader: string) {
  const recipientAddresses = extractEmailAddresses(recipientHeader);
  if (recipientAddresses.length === 0) return null;

  return prisma.emailSenderIdentity.findFirst({
    where: {
      email: { in: recipientAddresses },
      isActive: true,
    },
  });
}

export function formatSenderAddress(displayName: string, email: string) {
  const safeDisplayName = displayName.replace(/[\r\n"]/g, '').trim();
  return `"${safeDisplayName}" <${email}>`;
}

export function appendEmailSignature(body: string, signature: string) {
  const normalizedBody = body.trim();
  const normalizedSignature = signature.trim();

  if (!normalizedSignature) return normalizedBody;
  if (!normalizedBody) return normalizedSignature;
  return `${normalizedBody}\n\n-- \n${normalizedSignature}`;
}
