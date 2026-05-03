'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Ensures the user is an ADMIN before allowing access to productivity features.
 */
async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session.user;
}

// --- PROJECTS ---

export async function getProjects() {
  const user = await ensureAdmin();
  return await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProject(id: string) {
  const user = await ensureAdmin();
  return await prisma.project.findUnique({
    where: { id, userId: user.id },
    include: {
      tasks: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createProject(data: {
  name: string;
  clientName?: string;
  budget?: number;
  description?: string;
  color?: string;
  deadline?: Date;
}) {
  const user = await ensureAdmin();
  const project = await prisma.project.create({
    data: {
      ...data,
      userId: user.id,
    },
  });
  revalidatePath('/dashboard/productivity/projects');
  return project;
}

export async function updateProject(id: string, data: any) {
  const user = await ensureAdmin();
  const project = await prisma.project.update({
    where: { id, userId: user.id },
    data,
  });
  revalidatePath('/dashboard/productivity/projects');
  return project;
}

export async function deleteProject(id: string) {
  const user = await ensureAdmin();
  await prisma.project.delete({
    where: { id, userId: user.id },
  });
  revalidatePath('/dashboard/productivity/projects');
  return { success: true };
}

// --- TASKS ---

export async function getTasks(projectId?: string) {
  const user = await ensureAdmin();
  return await prisma.task.findMany({
    where: { 
      userId: user.id,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
    ],
  });
}

export async function createTask(data: {
  title: string;
  projectId?: string;
  priority?: string;
  notes?: string;
  dueDate?: Date;
}) {
  const user = await ensureAdmin();
  const task = await prisma.task.create({
    data: {
      ...data,
      userId: user.id,
      status: 'pending',
    },
  });
  revalidatePath('/dashboard/productivity/tasks');
  return task;
}

export async function deleteTask(id: string) {
  const user = await ensureAdmin();
  await prisma.task.delete({
    where: { id, userId: user.id },
  });
  revalidatePath('/dashboard/productivity/tasks');
  return { success: true };
}

export async function updateTask(id: string, data: any) {
  const user = await ensureAdmin();
  const task = await prisma.task.update({
    where: { id, userId: user.id },
    data,
  });
  revalidatePath('/dashboard/productivity/tasks');
  return task;
}

// --- TIME TRACKING ---

export async function addTimeEntry(data: {
  projectId?: string;
  description?: string;
  duration: number;
  date: Date;
}) {
  const user = await ensureAdmin();
  const entry = await prisma.timeEntry.create({
    data: {
      ...data,
      userId: user.id,
    },
  });
  revalidatePath('/dashboard/productivity/projects');
  return entry;
}

// --- NOTES ---

export async function getNotes() {
  const user = await ensureAdmin();
  return await prisma.personalNote.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createNote(data: {
  title: string;
  content: string;
  category?: string;
  color?: string;
}) {
  const user = await ensureAdmin();
  const note = await prisma.personalNote.create({
    data: {
      ...data,
      userId: user.id,
    },
  });
  revalidatePath('/dashboard/productivity/notes');
  return note;
}

export async function updateNote(id: string, data: any) {
  const user = await ensureAdmin();
  const note = await prisma.personalNote.update({
    where: { id, userId: user.id },
    data,
  });
  revalidatePath('/dashboard/productivity/notes');
  return note;
}

export async function deleteNote(id: string) {
  const user = await ensureAdmin();
  await prisma.personalNote.delete({
    where: { id, userId: user.id },
  });
  revalidatePath('/dashboard/productivity/notes');
  return { success: true };
}
// --- CALENDAR EVENTS ---

export async function getCalendarEvents() {
  const user = await ensureAdmin();
  return await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    orderBy: { start: 'asc' },
  });
}

export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
}) {
  const user = await ensureAdmin();
  const event = await prisma.calendarEvent.create({
    data: {
      ...data,
      userId: user.id,
    },
  });
  revalidatePath('/dashboard/productivity/calendar');
  return event;
}

export async function updateCalendarEvent(id: string, data: any) {
  const user = await ensureAdmin();
  const event = await prisma.calendarEvent.update({
    where: { id, userId: user.id },
    data,
  });
  revalidatePath('/dashboard/productivity/calendar');
  return event;
}

export async function deleteCalendarEvent(id: string) {
  const user = await ensureAdmin();
  await prisma.calendarEvent.delete({
    where: { id, userId: user.id },
  });
  revalidatePath('/dashboard/productivity/calendar');
  return { success: true };
}
