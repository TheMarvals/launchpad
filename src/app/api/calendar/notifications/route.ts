import { NextResponse } from 'next/server';
import {
  processHourBeforeNotifications,
  processDailyDigest,
  processTomorrowPreview,
} from '@/lib/calendar-notifications';

/**
 * API route to trigger calendar notifications.
 * Can be called by a cron job (e.g. Vercel Cron, GitHub Actions).
 *
 * Secure this with a secret header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('Authorization')?.replace('Bearer ', '');

  const cronSecret = process.env.CRON_SECRET || process.env.AUTH_SECRET;

  if (secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = searchParams.get('type') || 'daily';

  try {
    switch (type) {
      case 'daily':
        await processDailyDigest();
        break;
      case 'tomorrow':
        await processTomorrowPreview();
        break;
      case 'upcoming':
        await processHourBeforeNotifications();
        break;
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, type });
  } catch (e) {
    console.error('[API] Calendar notifications error:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
