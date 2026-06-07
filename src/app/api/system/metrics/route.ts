import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPrismaMetrics } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const metrics = getPrismaMetrics();
  return NextResponse.json({
    ...metrics,
    uptimeSeconds: Math.round(metrics.uptimeMs / 1000),
    criticalThresholdMs: Number(process.env.PRISMA_CRITICAL_QUERY_MS) || 2000,
  });
}
