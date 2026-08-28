'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPitch(formData: any) {
  const {
    title,
    subtitle,
    clientName,
    clientId,
    userId,
    status,
    theme,
    slides,
  } = formData;

  // Determine next correlativo: start from 100 if none exists
  const maxRes = await prisma.pitch.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const pitch = await prisma.pitch.create({
    data: {
      correlativo: nextCorrelativo,
      title: title || 'Pitch Proposal',
      subtitle: subtitle || 'Where ideas take off',
      clientName: clientName || null,
      clientId: clientId || null,
      userId: userId || null,
      status: status || 'Borrador',
      theme: theme || 'midnight',
      slides: slides || [],
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');

  return pitch;
}

export async function getPitches() {
  return await prisma.pitch.findMany({
    include: {
      client: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          cargo: true,
          telefono: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPitchById(id: string) {
  return await prisma.pitch.findUnique({
    where: { id },
    include: {
      client: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          cargo: true,
          telefono: true,
        },
      },
    },
  });
}

export async function updatePitch(id: string, formData: any) {
  const {
    title,
    subtitle,
    clientName,
    clientId,
    userId,
    status,
    theme,
    slides,
  } = formData;

  const pitch = await prisma.pitch.update({
    where: { id },
    data: {
      title,
      subtitle,
      clientName: clientName || null,
      clientId: clientId || null,
      userId: userId || null,
      status: status || 'Borrador',
      theme: theme || 'midnight',
      slides: slides || [],
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');
  revalidatePath(`/dashboard/pitches/edit/${id}`);
  revalidatePath(`/pitches/${id}`);
  revalidatePath(`/es/pitches/${id}`);
  revalidatePath(`/en/pitches/${id}`);

  return pitch;
}

export interface PitchCardCustomizationInput {
  subject?: string;
  introMessage?: string;
  clientTag?: string;
  tagline?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  pillarsLabel?: string;
  keyPillars?: Array<{ title: string; subtitle?: string }>;
  buttonText?: string;
  linkText?: string;
  badgeText?: string;
  senderName?: string;
  senderRole?: string;
}

export async function savePitchCardCustomization(pitchId: string, customData: PitchCardCustomizationInput) {
  const pitch = await prisma.pitch.findUnique({
    where: { id: pitchId },
  });

  if (!pitch) {
    throw new Error('Pitch not found');
  }

  const slides: any[] = Array.isArray(pitch.slides) ? [...(pitch.slides as any[])] : [];

  // Update hero slide if present
  const heroIndex = slides.findIndex((s) => s.type === 'hero');
  if (heroIndex !== -1) {
    slides[heroIndex] = {
      ...slides[heroIndex],
      title: customData.cardTitle || slides[heroIndex].title,
      subtitle: customData.cardSubtitle !== undefined ? customData.cardSubtitle : slides[heroIndex].subtitle,
      clientName: customData.clientTag || slides[heroIndex].clientName,
      cta: {
        ...slides[heroIndex].cta,
        text: customData.buttonText || slides[heroIndex].cta?.text,
      },
    };
  }

  // Update pillars slide if present
  const pillarsIndex = slides.findIndex((s) => s.type === 'pillars');
  if (pillarsIndex !== -1 && customData.keyPillars && customData.keyPillars.length > 0) {
    const existingCards = Array.isArray(slides[pillarsIndex].cards) ? slides[pillarsIndex].cards : [];
    const updatedCards = customData.keyPillars.map((p, idx) => ({
      ...existingCards[idx],
      title: p.title,
      subtitle: p.subtitle,
      description: existingCards[idx]?.description || p.subtitle || '',
      icon: existingCards[idx]?.icon || 'star',
    }));
    slides[pillarsIndex] = {
      ...slides[pillarsIndex],
      cards: updatedCards,
    };
  }

  // Store/update persistent email configuration in slides metadata
  const emailConfigIndex = slides.findIndex((s) => s.type === 'emailConfig');
  const emailConfigData = {
    type: 'emailConfig',
    subject: customData.subject,
    introMessage: customData.introMessage,
    clientTag: customData.clientTag,
    tagline: customData.tagline,
    cardTitle: customData.cardTitle,
    cardSubtitle: customData.cardSubtitle,
    pillarsLabel: customData.pillarsLabel,
    keyPillars: customData.keyPillars,
    buttonText: customData.buttonText,
    linkText: customData.linkText,
    badgeText: customData.badgeText,
    senderName: customData.senderName,
    senderRole: customData.senderRole,
    updatedAt: new Date().toISOString(),
  };

  if (emailConfigIndex !== -1) {
    slides[emailConfigIndex] = emailConfigData;
  } else {
    slides.push(emailConfigData);
  }

  const updatedPitch = await prisma.pitch.update({
    where: { id: pitchId },
    data: {
      title: customData.cardTitle || pitch.title,
      subtitle: customData.cardSubtitle !== undefined ? customData.cardSubtitle : pitch.subtitle,
      clientName: customData.clientTag || pitch.clientName,
      slides,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');
  revalidatePath(`/dashboard/pitches/edit/${pitchId}`);
  revalidatePath(`/dashboard/emails/new`);
  revalidatePath(`/es/dashboard/emails/new`);
  revalidatePath(`/en/dashboard/emails/new`);
  revalidatePath(`/dashboard/emails`);
  revalidatePath(`/es/dashboard/emails`);
  revalidatePath(`/en/dashboard/emails`);
  revalidatePath(`/pitches/${pitchId}`);
  revalidatePath(`/es/pitches/${pitchId}`);
  revalidatePath(`/en/pitches/${pitchId}`);

  return { success: true, pitch: updatedPitch };
}

export async function updatePitchStatus(id: string, status: string) {
  const pitch = await prisma.pitch.update({
    where: { id },
    data: { status },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');

  return pitch;
}

export async function duplicatePitch(id: string) {
  const original = await prisma.pitch.findUnique({
    where: { id },
  });

  if (!original) throw new Error('Pitch not found');

  const maxRes = await prisma.pitch.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const pitch = await prisma.pitch.create({
    data: {
      correlativo: nextCorrelativo,
      title: `${original.title} (Copia)`,
      subtitle: original.subtitle,
      clientName: original.clientName,
      clientId: original.clientId,
      userId: original.userId,
      status: 'Borrador',
      theme: original.theme,
      slides: original.slides as any,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');

  return pitch;
}

export async function deletePitch(id: string) {
  await prisma.pitch.delete({
    where: { id },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');
}
