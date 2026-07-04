export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = (await import('node-cron')).default;
    const { processHourBeforeNotifications, processDailyDigest, processTomorrowPreview } =
      await import('./lib/calendar-notifications');

    // Every 5 minutes — 1 hour before reminder
    cron.schedule('*/5 * * * *', async () => {
      console.log('[CRON] Running hour-before notifications...');
      try { await processHourBeforeNotifications(); } catch (e) { console.error('[CRON] Hour-before error:', e); }
    });

    // 7:00 AM — daily digest
    cron.schedule('0 7 * * *', async () => {
      console.log('[CRON] Running daily digest...');
      try { await processDailyDigest(); } catch (e) { console.error('[CRON] Daily digest error:', e); }
    });

    // 8:00 PM — tomorrow preview
    cron.schedule('0 20 * * *', async () => {
      console.log('[CRON] Running tomorrow preview...');
      try { await processTomorrowPreview(); } catch (e) { console.error('[CRON] Tomorrow preview error:', e); }
    });

    console.log('[CRON] Calendar notification jobs scheduled.');
  }
}
