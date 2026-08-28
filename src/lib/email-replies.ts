import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import {
  appendEmailSignature,
  findActiveSenderIdentity,
  formatSenderAddress,
} from '@/lib/email-sender-identities';
import type { OutboundEmailAttachment } from '@/lib/email-attachments';
import { PitchInvitationEmail } from '@/emails/PitchInvitationEmail';
import { parsePitchTheme } from '@/lib/pitch-theme';

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
  templateType?: 'standard' | 'pitch';
  pitchId?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  clientTag?: string;
  tagline?: string;
  pillarsLabel?: string;
  keyPillars?: Array<{ title: string; subtitle?: string }>;
  buttonText?: string;
  linkText?: string;
  badgeText?: string;
  locale?: string;
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

  let reactComponent: React.ReactElement | undefined = undefined;

  if (input.templateType === 'pitch' && input.pitchId) {
    const pitch = await prisma.pitch.findUnique({
      where: { id: input.pitchId },
      include: {
        client: true,
        user: {
          select: { name: true, cargo: true, email: true },
        },
      },
    });

    if (pitch) {
      const clientName = pitch.client?.razonSocial || pitch.clientName || 'Cliente';
      const { color: accentColor } = parsePitchTheme(pitch.theme, pitch.title, clientName);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://launchpad.themarvals.com';
      const pitchUrl = `${appUrl}/${input.locale || 'es'}/pitches/${pitch.id}`;

      const slides = Array.isArray(pitch.slides) ? (pitch.slides as any[]) : [];
      const pillarsSlide = slides.find((s) => s.type === 'pillars');
      const defaultPillars = pillarsSlide && Array.isArray(pillarsSlide.cards) && pillarsSlide.cards.length > 0
        ? pillarsSlide.cards.map((c: any) => ({
            title: c.title,
            subtitle: c.subtitle || (c.description ? c.description.slice(0, 50) : undefined),
          }))
        : [
            { title: 'Ecosistema Digital 360°', subtitle: 'Estrategia y Arquitectura' },
            { title: 'Experiencia & UI/UX', subtitle: 'Diseño de Alto Impacto' },
            { title: 'Roadmap & Rendimiento', subtitle: 'Ejecución y Escalamiento' },
          ];

      const keyPillars = input.keyPillars && input.keyPillars.length > 0
        ? input.keyPillars
        : defaultPillars;

      const senderSig = sender.signature?.trim() || '';
      const sigLines = senderSig.split('\n').map((l) => l.trim()).filter(Boolean);
      let resolvedSenderName = sender.displayName || pitch.user?.name || 'Eduardo Marval';
      let resolvedSenderRole = pitch.user?.cargo || 'Lead Solution Architect';

      if (resolvedSenderName.toLowerCase().includes('contact') || resolvedSenderName.toLowerCase().includes('launchpad')) {
        if (sigLines[0] && !sigLines[0].toLowerCase().includes('contact') && !sigLines[0].toLowerCase().includes('launchpad')) {
          resolvedSenderName = sigLines[0];
          if (sigLines[1]) resolvedSenderRole = sigLines.slice(1).join(' · ');
        } else if (pitch.user?.name) {
          resolvedSenderName = pitch.user.name;
        } else {
          resolvedSenderName = 'Eduardo Marval';
        }
      } else if (sigLines.length > 0) {
        if (sigLines[0].toLowerCase() === resolvedSenderName.toLowerCase() && sigLines[1]) {
          resolvedSenderRole = sigLines.slice(1).join(' · ');
        } else if (sigLines.length > 0 && !sigLines[0].toLowerCase().includes('contact')) {
          resolvedSenderRole = sigLines.join(' · ');
        }
      }

      reactComponent = PitchInvitationEmail({
        introMessage: input.body,
        pitchTitle: input.cardTitle || pitch.title,
        pitchSubtitle: input.cardSubtitle !== undefined ? input.cardSubtitle : (pitch.subtitle || undefined),
        clientName,
        clientTag: input.clientTag,
        tagline: input.tagline,
        pillarsLabel: input.pillarsLabel,
        badgeText: input.badgeText?.trim() || undefined,
        pitchUrl,
        accentColor,
        buttonText: input.buttonText?.trim() || undefined,
        linkText: input.linkText?.trim() || undefined,
        keyPillars,
        senderName: resolvedSenderName,
        senderRole: resolvedSenderRole,
        senderEmail: sender.email,
        locale: input.locale || 'es',
      });
    }
  }

  const response = await resend.emails.send({
    from: formatSenderAddress(sender.displayName, sender.email),
    to: input.to,
    cc: input.cc.length > 0 ? input.cc : undefined,
    bcc: input.bcc.length > 0 ? input.bcc : undefined,
    replyTo: sender.email,
    subject: input.subject,
    text: finalBody,
    react: reactComponent,
    attachments: attachments.length > 0
      ? attachments.map((attachment) => ({
          filename: attachment.filename,
          contentType: attachment.contentType,
          content: attachment.content,
        }))
      : undefined,
    tags: [
      { name: 'category', value: input.templateType === 'pitch' ? 'pitch_invitation' : 'platform_new_email' },
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
