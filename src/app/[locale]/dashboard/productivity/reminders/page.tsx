import { getUpcomingReminders } from '@/app/actions/reminders';
import RemindersBoard from '@/components/productivity/RemindersBoard';

export default async function RemindersPage() {
  const { tasks, events, vpsExpirations, openTickets, expiringQuotes, failedActions } = await getUpcomingReminders();

  return (
    <RemindersBoard 
      tasks={tasks} 
      events={events} 
      vpsExpirations={vpsExpirations} 
      openTickets={openTickets}
      expiringQuotes={expiringQuotes}
      failedActions={failedActions}
    />
  );
}
