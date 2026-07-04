import { prisma } from '@/lib/prisma';
import {
  sendCalendarHourBeforeReminder,
  sendCalendarDailyDigest,
  sendCalendarTomorrowPreview,
} from '@/lib/email';
import { RRule } from 'rrule';
import { format, fromZonedTime } from 'date-fns-tz';

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
  const now = new Date();

  try {
    const users = await prisma.user.findMany({
      include: {
        events: true,
        sharedEvents: { include: { event: true } },
        settings: true,
      },
    });

    for (const user of users) {
      const calendarDailyDigest = user.settings?.calendarDailyDigest ?? true;
      if (!calendarDailyDigest) continue;

      const tz = user.settings?.timezone || 'America/Caracas';
      const localHour = parseInt(format(now, 'H', { timeZone: tz }), 10);
      
      // Only send digest at 7 AM in the user's local timezone
      if (localHour !== 7) continue;

      // Calculate the start and end of 'today' in the user's timezone
      const ymdToday = format(now, 'yyyy-MM-dd', { timeZone: tz });
      const todayStartUTC = fromZonedTime(`${ymdToday}T00:00:00`, tz);
      
      const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const ymdTomorrow = format(nextDay, 'yyyy-MM-dd', { timeZone: tz });
      const tomorrowStartUTC = fromZonedTime(`${ymdTomorrow}T00:00:00`, tz);

      // Now filter the user's events using these UTC bounds
      const allEvents = [
        ...user.events,
        ...user.sharedEvents.map((s: any) => s.event),
      ].filter((e: any) => {
        // Broad initial filter to avoid expanding things way out of bounds
        if (!e.recurrenceRule && (e.start >= tomorrowStartUTC || e.end < todayStartUTC)) return false;
        return true;
      });

      const expanded = expandEventsForRange(allEvents, todayStartUTC, tomorrowStartUTC);
      if (expanded.length === 0) continue;

      // Check if digest already sent for this user today
      const existing = await prisma.eventNotificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'today_digest',
          eventDate: { gte: todayStartUTC, lt: tomorrowStartUTC },
        },
      });

      if (existing) continue;

      try {
        await sendCalendarDailyDigest(user.email, user.name, expanded, 'es');
        
        // Log that we sent it for today
        await prisma.eventNotificationLog.create({
          data: {
            eventId: 'daily_digest', // use a dummy ID for digests since it's per-user not per-event
            userId: user.id,
            type: 'today_digest',
            eventDate: todayStartUTC,
          },
        });
      } catch (e) {
        console.error('[CRON] Error sending daily digest to', user.email, e);
      }
    }
  } catch (e) {
    console.error('[CRON] Error in processDailyDigest:', e);
  }
}

/**
 * Process tomorrow preview notifications.
 */
export async function processTomorrowPreview() {
  const now = new Date();

  try {
    const users = await prisma.user.findMany({
      include: {
        events: true,
        sharedEvents: { include: { event: true } },
        settings: true,
      },
    });

    for (const user of users) {
      const calendarTomorrowPreview = user.settings?.calendarTomorrowPreview ?? true;
      if (!calendarTomorrowPreview) continue;

      const tz = user.settings?.timezone || 'America/Caracas';
      const localHour = parseInt(format(now, 'H', { timeZone: tz }), 10);
      
      // Only send preview at 8 PM (20:00) in the user's local timezone
      if (localHour !== 20) continue;

      // Calculate the start and end of 'tomorrow' in the user's timezone
      const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const ymdTomorrow = format(nextDay, 'yyyy-MM-dd', { timeZone: tz });
      const tomorrowStartUTC = fromZonedTime(`${ymdTomorrow}T00:00:00`, tz);
      
      const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const ymdDayAfter = format(dayAfter, 'yyyy-MM-dd', { timeZone: tz });
      const tomorrowEndUTC = fromZonedTime(`${ymdDayAfter}T00:00:00`, tz);

      const allEvents = [
        ...user.events,
        ...user.sharedEvents.map((s: any) => s.event),
      ].filter((e: any) => {
        if (!e.recurrenceRule && (e.start >= tomorrowEndUTC || e.end < tomorrowStartUTC)) return false;
        return true;
      });

      const expanded = expandEventsForRange(allEvents, tomorrowStartUTC, tomorrowEndUTC);
      if (expanded.length === 0) continue;

      const existing = await prisma.eventNotificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'tomorrow_digest',
          eventDate: { gte: tomorrowStartUTC, lt: tomorrowEndUTC },
        },
      });

      if (existing) continue;

      try {
        await sendCalendarTomorrowPreview(user.email, user.name, expanded, 'es');
        
        await prisma.eventNotificationLog.create({
          data: {
            eventId: 'tomorrow_digest',
            userId: user.id,
            type: 'tomorrow_digest',
            eventDate: tomorrowStartUTC,
          },
        });
      } catch (e) {
        console.error('[CRON] Error sending tomorrow preview to', user.email, e);
      }
    }
  } catch (e) {
    console.error('[CRON] Error in processTomorrowPreview:', e);
  }
}
