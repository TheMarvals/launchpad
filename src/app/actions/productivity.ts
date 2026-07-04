'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { RRule } from 'rrule';
import { sendEventSharedNotification, sendTaskAssignedNotification } from '@/lib/email';

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
  await ensureAdmin();
  return await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProject(id: string) {
  await ensureAdmin();
  return await prisma.project.findUnique({
    where: { id },
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
  await ensureAdmin();
  const project = await prisma.project.update({
    where: { id },
    data,
  });
  revalidatePath('/dashboard/productivity/projects');
  return project;
}

export async function deleteProject(id: string) {
  await ensureAdmin();
  await prisma.project.delete({
    where: { id },
  });
  revalidatePath('/dashboard/productivity/projects');
  return { success: true };
}

// --- TASKS ---

export async function getTask(id: string) {
  await ensureAdmin();
  return await prisma.task.findUnique({
    where: { id },
  });
}

export async function getAdminUsers() {
  await ensureAdmin();
  return await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true },
  });
}

export async function getTasks(projectId?: string) {
  await ensureAdmin();
  return await prisma.task.findMany({
    where: { 
      ...(projectId ? { projectId } : {}),
    },
    include: {
      assignee: true,
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
  assigneeId?: string;
}) {
  const user = await ensureAdmin();
  const task = await prisma.task.create({
    data: {
      ...data,
      userId: user.id,
      status: 'todo',
    },
    include: { assignee: true }
  });

  // Notify assignee if it's someone else
  if (task.assigneeId && task.assigneeId !== user.id && task.assignee) {
    await sendTaskAssignedNotification(
      task.assignee.email,
      task.assignee.name,
      { title: task.title, priority: task.priority, dueDate: task.dueDate?.toISOString() },
      user.name || 'Launchpad Admin',
      'es'
    );
  }

  revalidatePath('/dashboard/productivity/tasks');
  return task;
}

export async function deleteTask(id: string) {
  await ensureAdmin();
  await prisma.task.delete({
    where: { id },
  });
  revalidatePath('/dashboard/productivity/tasks');
  return { success: true };
}

export async function updateTask(id: string, data: any) {
  const user = await ensureAdmin();
  
  // Get old task to compare assignees
  const oldTask = await prisma.task.findUnique({ where: { id }, select: { assigneeId: true } });
  
  const updated = await prisma.task.update({
    where: { id },
    data,
    include: { assignee: true }
  });

  // Notify new assignee if it changed and it's someone else
  if (
    data.assigneeId && 
    oldTask?.assigneeId !== data.assigneeId && 
    data.assigneeId !== user.id && 
    updated.assignee
  ) {
    await sendTaskAssignedNotification(
      updated.assignee.email,
      updated.assignee.name,
      { title: updated.title, priority: updated.priority, dueDate: updated.dueDate?.toISOString() },
      user.name || 'Launchpad Admin',
      'es'
    );
  }

  revalidatePath('/dashboard/productivity/tasks');
  return updated;
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
    where: {
      OR: [
        { userId: user.id },
        { isPublic: true }
      ]
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createNote(data: {
  title: string;
  content?: string;
  category?: string;
  color?: string;
  isPublic?: boolean;
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

/**
 * Expands recurring events into individual occurrences within a date range.
 */
function expandRecurringEvents(
  events: any[],
  rangeStart: Date,
  rangeEnd: Date
): any[] {
  const expanded: any[] = [];

  for (const event of events) {
    const isShared = event._isShared || false;

    if (!event.recurrenceRule) {
      expanded.push({
        ...event,
        isRecurring: false,
        isShared,
        originalEventId: event.id,
      });
      continue;
    }

    // Recurring event — generate occurrences
    const duration = event.end.getTime() - event.start.getTime();
    const excludedDates: string[] = event.excludedDates
      ? JSON.parse(event.excludedDates)
      : [];

    const effectiveEnd = event.recurrenceEnd
      ? new Date(Math.min(event.recurrenceEnd.getTime(), rangeEnd.getTime()))
      : rangeEnd;

    try {
      const rule = RRule.fromString(event.recurrenceRule);
      const occurrences = rule.between(rangeStart, effectiveEnd, true);

      for (const occurrence of occurrences) {
        const dateISO = occurrence.toISOString();
        if (excludedDates.includes(dateISO)) continue;

        const occurrenceEnd = new Date(occurrence.getTime() + duration);

        expanded.push({
          ...event,
          id: `${event.id}_${dateISO}`,
          start: occurrence,
          end: occurrenceEnd,
          isRecurring: true,
          isShared,
          originalEventId: event.id,
        });
      }
    } catch (e) {
      console.error('Error parsing recurrence rule for event', event.id, e);
    }
  }

  return expanded;
}

export async function getCalendarEvent(id: string) {
  await ensureAdmin();
  return await prisma.calendarEvent.findUnique({
    where: { id },
    include: {
      shares: { include: { user: true } },
      parentEvent: true,
    },
  });
}

export async function getCalendarEvents(
  rangeStart?: Date,
  rangeEnd?: Date
) {
  const user = await ensureAdmin();

  // Fetch own events
  const ownEvents = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    include: {
      shares: { include: { user: true } },
      parentEvent: true,
    },
    orderBy: { start: 'asc' },
  });

  // Fetch events shared with this user
  const sharedEventRecords = await prisma.eventShare.findMany({
    where: { userId: user.id },
    include: {
      event: {
        include: {
          shares: { include: { user: true } },
          parentEvent: true,
        },
      },
    },
  });

  const sharedEvents = sharedEventRecords.map((s) => ({
    ...s.event,
    _isShared: true,
  }));

  const allEvents = [
    ...ownEvents,
    ...sharedEvents,
  ];

  // If range provided, expand recurring events
  if (rangeStart && rangeEnd) {
    return expandRecurringEvents(allEvents, rangeStart, rangeEnd);
  }

  // Default: return all with flags
  return allEvents.map((event) => ({
    ...event,
    isRecurring: !!event.recurrenceRule,
    isShared: (event as any)._isShared || false,
    originalEventId: event.id,
  }));
}

export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  recurrenceRule?: string;
  recurrenceEnd?: Date;
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

export async function updateCalendarEvent(
  id: string,
  data: any,
  editMode: 'all' | 'this' = 'all',
  occurrenceDate?: Date
) {
  const user = await ensureAdmin();

  if (editMode === 'this' && occurrenceDate) {
    // Create exception event and exclude the occurrence from parent
    const parentEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });
    if (!parentEvent) throw new Error('Event not found');

    // Add occurrence date to parent's excludedDates
    const excludedDates: string[] = parentEvent.excludedDates
      ? JSON.parse(parentEvent.excludedDates)
      : [];
    excludedDates.push(occurrenceDate.toISOString());
    await prisma.calendarEvent.update({
      where: { id },
      data: { excludedDates: JSON.stringify(excludedDates) },
    });

    // Create exception event linked to parent
    const exception = await prisma.calendarEvent.create({
      data: {
        title: data.title || parentEvent.title,
        description: data.description ?? parentEvent.description,
        start: data.start || occurrenceDate,
        end: data.end || new Date(occurrenceDate.getTime() + (parentEvent.end.getTime() - parentEvent.start.getTime())),
        allDay: data.allDay ?? parentEvent.allDay,
        color: data.color || parentEvent.color,
        userId: parentEvent.userId,
        parentEventId: id,
      },
    });

    revalidatePath('/dashboard/productivity/calendar');
    return exception;
  }

  // Default: update the event directly
  const event = await prisma.calendarEvent.update({
    where: { id },
    data,
  });
  revalidatePath('/dashboard/productivity/calendar');
  return event;
}

export async function deleteCalendarEvent(
  id: string,
  deleteMode: 'all' | 'this' | 'thisAndFuture' = 'all',
  occurrenceDate?: Date
) {
  await ensureAdmin();

  if (deleteMode === 'this' && occurrenceDate) {
    // Add occurrenceDate to excludedDates
    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');

    const excludedDates: string[] = event.excludedDates
      ? JSON.parse(event.excludedDates)
      : [];
    excludedDates.push(occurrenceDate.toISOString());
    await prisma.calendarEvent.update({
      where: { id },
      data: { excludedDates: JSON.stringify(excludedDates) },
    });

    revalidatePath('/dashboard/productivity/calendar');
    return { success: true };
  }

  if (deleteMode === 'thisAndFuture' && occurrenceDate) {
    // Set recurrenceEnd to the day before occurrenceDate
    const dayBefore = new Date(occurrenceDate);
    dayBefore.setDate(dayBefore.getDate() - 1);

    await prisma.calendarEvent.update({
      where: { id },
      data: { recurrenceEnd: dayBefore },
    });

    revalidatePath('/dashboard/productivity/calendar');
    return { success: true };
  }

  // Default: delete the event entirely
  await prisma.calendarEvent.delete({
    where: { id },
  });
  revalidatePath('/dashboard/productivity/calendar');
  return { success: true };
}

// --- EVENT SHARING ---

export async function shareEvent(eventId: string, userEmail: string) {
  const user = await ensureAdmin();

  // Verify current user owns the event
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });
  if (!event || event.userId !== user.id) {
    throw new Error('Unauthorized: You can only share your own events');
  }

  // Find target user by email
  const targetUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });
  if (!targetUser) {
    throw new Error('User not found with that email');
  }

  const share = await prisma.eventShare.create({
    data: {
      eventId,
      userId: targetUser.id,
    },
    include: { user: true },
  });

  // Notify the recipient
  try {
    await sendEventSharedNotification(targetUser.email, targetUser.name, event, user.name || 'Usuario', 'es');
  } catch (e) {
    console.error('Error sending event shared notification:', e);
  }

  revalidatePath('/dashboard/productivity/calendar');
  return share;
}

export async function unshareEvent(eventId: string, userId: string) {
  const user = await ensureAdmin();

  // Verify current user owns the event
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });
  if (!event || event.userId !== user.id) {
    throw new Error('Unauthorized: You can only manage sharing for your own events');
  }

  await prisma.eventShare.delete({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  revalidatePath('/dashboard/productivity/calendar');
  return { success: true };
}

export async function getEventShares(eventId: string) {
  const user = await ensureAdmin();

  // Verify current user owns the event
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });
  if (!event || event.userId !== user.id) {
    throw new Error('Unauthorized: You can only view shares for your own events');
  }

  return await prisma.eventShare.findMany({
    where: { eventId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

// --- SETTINGS ---

export async function getProductivitySettings() {
  const user = await ensureAdmin();
  const settings = await prisma.productivitySettings.findUnique({
    where: { userId: user.id },
  });

  if (!settings) {
    return await prisma.productivitySettings.create({
      data: { userId: user.id },
    });
  }

  return settings;
}

export async function updateProductivitySettings(data: any) {
  const user = await ensureAdmin();
  const settings = await prisma.productivitySettings.update({
    where: { userId: user.id },
    data,
  });
  revalidatePath('/dashboard/productivity/settings');
  return settings;
}

import { sendTelegramMessage } from '@/lib/telegram';

export async function testTelegram(botToken: string, chatId: string) {
  await ensureAdmin();
  return await sendTelegramMessage(botToken, chatId, '🧪 <b>LAUNCHPAD Productivity</b>\nTest de conexión exitoso.');
}
