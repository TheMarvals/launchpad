import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ============================================================
// Monitoring state
// ============================================================

let totalQueries = 0;
let slowQueries: { query: string; duration: number; timestamp: string }[] = [];
let startedAt = Date.now();
const SLOW_QUERY_THRESHOLD_MS = Number(process.env.PRISMA_SLOW_QUERY_MS) || 500;
const CRITICAL_SLOW_QUERY_MS = Number(process.env.PRISMA_CRITICAL_QUERY_MS) || 2000;

// ============================================================
// PrismaClient factory
// ============================================================

function createClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ level: 'warn', emit: 'event' }, { level: 'error', emit: 'event' }]
        : [{ level: 'error', emit: 'event' }],
  });

  // Log Prisma warnings and errors in development
  if (process.env.NODE_ENV === 'development') {
    client.$on('warn' as any, (e: any) => {
      console.warn(`\x1b[33m[PRISMA]\x1b[0m`, e.message || e);
    });
    client.$on('error' as any, (e: any) => {
      console.error(`\x1b[31m[PRISMA]\x1b[0m`, e.message || e);
    });
  }

  return client;
}

// Detect if a cached PrismaClient is stale (schema changed since generated).
function isClientValid(c: PrismaClient): boolean {
  try {
    return typeof (c as any).user?.findMany === 'function';
  } catch {
    return false;
  }
}

export const prisma = (() => {
  if (globalForPrisma.prisma && isClientValid(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }
  const client = createClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
})();

// ============================================================
// Monitoring helpers
// ============================================================

export interface PrismaMetrics {
  totalQueries: number;
  slowQueries: { query: string; duration: number; timestamp: string }[];
  criticalCount: number;
  lastCritical: { query: string; duration: number; timestamp: string } | null;
  uptimeMs: number;
}

/** Get current Prisma query metrics */
export function getPrismaMetrics(): PrismaMetrics {
  const critical = slowQueries.filter(sq => sq.duration >= CRITICAL_SLOW_QUERY_MS);
  return {
    totalQueries,
    slowQueries: [...slowQueries],
    criticalCount: critical.length,
    lastCritical: critical.length > 0 ? critical[critical.length - 1] : null,
    uptimeMs: Date.now() - startedAt,
  };
}

/** Reset query counters */
export function resetPrismaMetrics(): void {
  totalQueries = 0;
  slowQueries = [];
  startedAt = Date.now();
}

/**
 * Wrap a Prisma query with timing and slow-query tracking.
 * Usage: await timedQuery(prisma.ticket.findMany({...}), 'ticket.findMany')
 */
export async function timedQuery<T>(promise: Promise<T>, label: string): Promise<T> {
  const start = performance.now();
  try {
    return await promise;
  } finally {
    totalQueries++;
    const duration = performance.now() - start;
    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      const entry = { query: label, duration: Math.round(duration), timestamp: new Date().toISOString() };
      slowQueries.push(entry);
      if (slowQueries.length > 100) slowQueries.shift();
      if (process.env.NODE_ENV === 'development') {
        console.warn(`\x1b[33m[PRISMA]\x1b[0m Slow query (\x1b[91m${Math.round(duration)}ms\x1b[0m): ${label}`);
      }
    }
  }
}
