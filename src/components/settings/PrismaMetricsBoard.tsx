'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: string;
}

interface Metrics {
  totalQueries: number;
  slowQueries: SlowQuery[];
  criticalCount: number;
  lastCritical: SlowQuery | null;
  uptimeSeconds: number;
  criticalThresholdMs: number;
}

const AUTO_REFRESH_MS = 30_000;

export default function PrismaMetricsBoard() {
  const t = useTranslations('Settings');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch('/api/system/metrics');
      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setMetrics(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMetrics(true);
      }, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchMetrics]);

  const handleRefresh = () => {
    fetchMetrics();
  };

  const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const formatDuration = (ms: number): string => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms}ms`;
  };

  const hasCritical = metrics && metrics.criticalCount > 0;

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body text-muted">
          {t('prisma.subtitle')}
        </p>
        <div className="flex items-center gap-xs">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(prev => !prev)}
            className={`h-[36px] px-xs text-xs font-bold uppercase tracking-wider transition-colors border flex items-center gap-xxs ${
              autoRefresh
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-hairline text-muted hover:text-ink'
            }`}
            title={autoRefresh ? t('prisma.autoRefreshOn') : t('prisma.autoRefreshOff')}
          >
            <span className="material-icons text-sm">{autoRefresh ? 'sync' : 'sync_disabled'}</span>
            {autoRefresh ? '30s' : t('prisma.autoRefreshOff')}
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-transparent border border-ink text-ink hover:bg-ink/10 px-sm h-[36px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center gap-xxs transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-icons text-sm">refresh</span>
            {loading ? t('prisma.refreshing') : t('prisma.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-semantic-danger/30 bg-semantic-danger/10 text-semantic-danger px-sm py-xs text-sm">
          {error === 'Unauthorized' ? t('prisma.unauthorized') : `${t('prisma.error')}: ${error}`}
        </div>
      )}

      {/* Critical Slow Query Alert */}
      {hasCritical && (
        <div className="border border-semantic-danger/30 bg-semantic-danger/10 p-sm">
          <div className="flex items-start gap-xs">
            <span className="material-icons text-semantic-danger text-lg mt-[2px]">warning</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-semantic-danger">
                {t('prisma.criticalAlertTitle', { count: metrics!.criticalCount })}
              </p>
              <p className="text-sm text-semantic-danger/80 mt-[2px]">
                {t('prisma.criticalAlertLine1')}
              </p>
              {metrics!.lastCritical && (
                <div className="mt-xxs text-xs font-mono text-semantic-danger/70">
                  <span className="font-semibold">{metrics!.lastCritical.query}</span> — {formatDuration(metrics!.lastCritical.duration)}
                  <span className="ml-xs">({new Date(metrics!.lastCritical.timestamp).toLocaleString()})</span>
                </div>
              )}
              <p className="text-xs text-semantic-danger/60 mt-[4px]">
                {t('prisma.criticalAlertLine2', { threshold: formatDuration(metrics!.criticalThresholdMs) })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-sm">
        {/* Total Queries */}
        <div className="border border-hairline bg-canvas-elevated p-sm">
          <div className="text-caption-uppercase text-muted font-semibold tracking-wider mb-xxs">
            {t('prisma.totalQueries')}
          </div>
          <div className="text-display-lg font-medium text-ink tabular-nums">
            {metrics ? metrics.totalQueries.toLocaleString() : '—'}
          </div>
        </div>

        {/* Slow Queries */}
        <div className="border border-hairline bg-canvas-elevated p-sm">
          <div className="text-caption-uppercase text-muted font-semibold tracking-wider mb-xxs">
            {t('prisma.slowQueries')}
          </div>
          <div className="text-display-lg font-medium tabular-nums"
               style={{ color: metrics && metrics.slowQueries.length > 0 ? '#d97706' : undefined }}>
            {metrics ? metrics.slowQueries.length.toLocaleString() : '—'}
          </div>
        </div>

        {/* Critical Slow Queries */}
        <div className="border border-hairline bg-canvas-elevated p-sm">
          <div className="text-caption-uppercase text-muted font-semibold tracking-wider mb-xxs">
            {t('prisma.critical')}
          </div>
          <div className="text-display-lg font-medium tabular-nums flex items-center gap-xs"
               style={{ color: hasCritical ? '#dc2626' : undefined }}>
            {metrics ? metrics.criticalCount.toLocaleString() : '—'}
            {hasCritical && (
              <span className="material-icons text-lg animate-pulse text-semantic-danger">emergency</span>
            )}
          </div>
        </div>

        {/* Uptime */}
        <div className="border border-hairline bg-canvas-elevated p-sm">
          <div className="text-caption-uppercase text-muted font-semibold tracking-wider mb-xxs">
            {t('prisma.uptime')}
          </div>
          <div className="text-display-lg font-medium text-ink tabular-nums font-mono">
            {metrics ? formatUptime(metrics.uptimeSeconds) : '—'}
          </div>
        </div>
      </div>

      {/* Slow Queries Table */}
      <div className="border border-hairline bg-canvas-elevated">
        <div className="px-sm py-xs border-b border-hairline">
          <h3 className="text-title-sm font-medium text-ink">{t('prisma.slowQueryList')}</h3>
        </div>
        {metrics && metrics.slowQueries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline">
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('prisma.query')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('prisma.duration')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('prisma.timestamp')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {metrics.slowQueries.slice().reverse().map((sq, i) => {
                  const isCritical = sq.duration >= metrics.criticalThresholdMs;
                  return (
                    <tr key={i} className={`hover:bg-canvas/80 transition-colors ${isCritical ? 'bg-semantic-danger/[0.03]' : ''}`}>
                      <td className="px-sm py-xs text-sm font-mono text-ink">
                        {isCritical && (
                          <span className="material-icons text-sm text-semantic-danger align-middle mr-xxs">warning</span>
                        )}
                        {sq.query}
                      </td>
                      <td className="px-sm py-xs">
                        <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${
                          isCritical
                            ? 'border-semantic-danger/30 bg-semantic-danger/10 text-semantic-danger'
                            : 'border-semantic-warning/30 bg-semantic-warning/10 text-semantic-warning'
                        }`}>
                          {formatDuration(sq.duration)}
                        </span>
                      </td>
                      <td className="px-sm py-xs text-sm text-muted font-mono">
                        {new Date(sq.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-xl text-muted text-sm">
            {t('prisma.noSlowQueries')}
          </div>
        )}
      </div>
    </div>
  );
}
