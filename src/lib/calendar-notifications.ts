import { prisma } from '@/lib/prisma';
import {
  sendCalendarHourBeforeReminder,
  sendCalendarDailyDigest,
  sendCalendarTomorrowPreview,
} from '@/lib/email';
import { RRule } from 'rrule';

interface ExpandedEvent {
  id: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  isRecurring: boolean;
  originalEventId: string;
}

/**
 * Expands recurring events within a date range.
 * Works with raw prisma CalendarEvent results.
 */
function expandEventsForRange(
  events: any[],
  rangeStart: Date,
  rangeEnd: Date
): ExpandedEvent[] {
  const expanded: ExpandedEvent[] = [];

  for (const event of events) {
    if (!event.recurrenceRule) {
      // Non-recurring event — pass through if within range
      if (event.start <= rangeEnd && event.end >= rangeStart) {
        expanded.push({
          id: event.id,
          title: event.title,
          description: event.description,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          color: event.color,
          isRecurring: false,
          originalEventId: event.id,
        });
      }
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
          id: `${event.id}_${dateISO}`,
          title: event.title,
          description: event.description,
          start: occurrence,
          end: occurrenceEnd,
          allDay: event.allDay,
          color: event.color,
          isRecurring: true,
          originalEventId: event.id,
        });
      }
    } catch (e) {
      console.error('[CRON] Error parsing recurrence rule for event', event.id, e);
    }
  }

  return expanded;
}

/**
 * Process 1-hour-before notifications.
 * Checks events starting between now and now + 65 minutes.
 */
export async function processHourBeforeNotifications() {
  const now = new Date();
  const rangeEnd = new Date(now.getTime() + 65 * 60 * 1000);

  try {
    // Find all users with events in range (own + shared)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            events: {
              some: {
                OR: [
                  // Non-recurring events in range
                  { start: { gte: now, lte: rangeEnd }, recurrenceRule: null },
                  // Recurring events (need expansion)
                  { recurrenceRule: { not: null } },
                ],
              },
            },
          },
          {
            sharedEvents: {
              some: {
                event: {
                  OR: [
                    { start: { gte: now, lte: rangeEnd }, recurrenceRule: null },
                    { recurrenceRule: { not: null } },
                  ],
                },
              },
            },
          },
        ],
      },
      include: {
        events: true,
        sharedEvents: { include: { event: true } },
        settings: true,
      },
    });

    for (const user of users) {
      // Check user preferences
      const calendarHourBefore = user.settings?.calendarHourBefore ?? true;
      if (!calendarHourBefore) continue;

      // Gather all events (own + shared)
      const allEvents = [
        ...user.events,
        ...user.sharedEvents.map((s: any) => s.event),
      ];

      // Expand recurring events
      const expanded = expandEventsForRange(allEvents, now, rangeEnd);

      for (const event of expanded) {
        // Check if notification already sent
        const existing = await prisma.eventNotificationLog.findUnique({
          where: {
            eventId_userId_type_eventDate: {
              eventId: event.originalEventId,
              userId: user.id,
              type: '1h_before',
              eventDate: event.start,
            },
          },
        });

        if (existing) continue;

        try {
          await sendCalendarHourBeforeReminder(user.email, user.name, event, 'es');
          await prisma.eventNotificationLog.create({
            data: {
              eventId: event.originalEventId,
              userId: user.id,
              type: '1h_before',
              eventDate: event.start,
            },
          });
        } catch (e) {
          console.error('[CRON] Error sending hour-before notification for event', event.id, e);
        }
      }
    }
  } catch (e) {
    console.error('[CRON] Error in processHourBeforeNotifications:', e);
  }
}

/**
 * Process daily digest notifications.
 * Sends a summary of today's events to each user.
 */
export async function processDailyDigest() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            events: {
              some: {
                OR: [
                  { start: { gte: today, lt: tomorrow }, recurrenceRule: null },
                  { recurrenceRule: { not: null } },
                ],
              },
            },
          },
          {
            sharedEvents: {
              some: {
                event: {
                  OR: [
                    { start: { gte: today, lt: tomorrow }, recurrenceRule: null },
                    { recurrenceRule: { not: null } },
                  ],
                },
              },
            },
          },
        ],
      },
      include: {
        events: true,
        sharedEvents: { include: { event: true } },
        settings: true,
      },
    });

    for (const user of users) {
      const calendarDailyDigest = user.settings?.calendarDailyDigest ?? true;
      if (!calendarDailyDigest) continue;

      const allEvents = [
        ...user.events,
        ...user.sharedEvents.map((s: any) => s.event),
      ];

      const expanded = expandEventsForRange(allEvents, today, tomorrow);
      if (expanded.length === 0) continue;

      // Check if digest already sent for this user today
      const existing = await prisma.eventNotificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'today_digest',
          eventDate: { gte: today, lt: tomorrow },
        },
      });

      if (existing) continue;

      try {
        await sendCalendarDailyDigest(user.email, user.name, expanded, 'es');

        // Create one log entry per event
        for (const event of expanded) {
          await prisma.eventNotificationLog.create({
            data: {
              eventId: event.originalEventId,
              userId: user.id,
              type: 'today_digest',
              eventDate: event.start,
            },
          });
        }
      } catch (e) {
        console.error('[CRON] Error sending daily digest for user', user.id, e);
      }
    }
  } catch (e) {
    console.error('[CRON] Error in processDailyDigest:', e);
  }
}

/**
 * Process tomorrow preview notifications.
 * Sends a preview of tomorrow's events to each user.
 */
export async function processTomorrowPreview() {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            events: {
              some: {
                OR: [
                  { start: { gte: tomorrow, lt: dayAfter }, recurrenceRule: null },
                  { recurrenceRule: { not: null } },
                ],
              },
            },
          },
          {
            sharedEvents: {
              some: {
                event: {
                  OR: [
                    { start: { gte: tomorrow, lt: dayAfter }, recurrenceRule: null },
                    { recurrenceRule: { not: null } },
                  ],
                },
              },
            },
          },
        ],
      },
      include: {
        events: true,
        sharedEvents: { include: { event: true } },
        settings: true,
      },
    });

    for (const user of users) {
      const calendarTomorrowPreview = user.settings?.calendarTomorrowPreview ?? true;
      if (!calendarTomorrowPreview) continue;

      const allEvents = [
        ...user.events,
        ...user.sharedEvents.map((s: any) => s.event),
      ];

      const expanded = expandEventsForRange(allEvents, tomorrow, dayAfter);
      if (expanded.length === 0) continue;

      // Check if preview already sent for this user
      const existing = await prisma.eventNotificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'tomorrow_digest',
          eventDate: { gte: tomorrow, lt: dayAfter },
        },
      });

      if (existing) continue;

      try {
        await sendCalendarTomorrowPreview(user.email, user.name, expanded, 'es');

        for (const event of expanded) {
          await prisma.eventNotificationLog.create({
            data: {
              eventId: event.originalEventId,
              userId: user.id,
              type: 'tomorrow_digest',
              eventDate: event.start,
            },
          });
        }
      } catch (e) {
        console.error('[CRON] Error sending tomorrow preview for user', user.id, e);
      }
    }
  } catch (e) {
    console.error('[CRON] Error in processTomorrowPreview:', e);
  }
}
