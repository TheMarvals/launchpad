import { NextResponse } from 'next/server';
import { triggerRemindersNotification } from '@/app/actions/reminders';

/**
 * API route to trigger productivity reminders summary.
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

  const locale = searchParams.get('locale') || 'es';
  const result = await triggerRemindersNotification(locale);

  if (result.success) {
    return NextResponse.json({ success: true, results: result.results });
  } else {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
}
