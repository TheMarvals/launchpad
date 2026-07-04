export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = (await import('node-cron')).default;
    const { processHourBeforeNotifications, processDailyDigest, processTomorrowPreview } =
      await import('./lib/calendar-notifications');

    // Every 5 minutes — 1 hour before reminder (no timezone changes needed here)
    cron.schedule('*/5 * * * *', async () => {
      console.log('[CRON] Running hour-before notifications...');
      try { await processHourBeforeNotifications(); } catch (e) { console.error('[CRON] Hour-before error:', e); }
    });

    // Every hour — check if it's the right time in the user's timezone for daily digest
    cron.schedule('0 * * * *', async () => {
      console.log('[CRON] Running daily digest check...');
      try { await processDailyDigest(); } catch (e) { console.error('[CRON] Daily digest error:', e); }
    });

    // Every hour — check if it's the right time in the user's timezone for tomorrow preview
    cron.schedule('0 * * * *', async () => {
      console.log('[CRON] Running tomorrow preview check...');
      try { await processTomorrowPreview(); } catch (e) { console.error('[CRON] Tomorrow preview error:', e); }
    });

    console.log('[CRON] Calendar notification jobs scheduled.');
  }
}
