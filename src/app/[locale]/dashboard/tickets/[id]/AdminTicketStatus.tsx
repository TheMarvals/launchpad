'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { updateTicketStatus } from '@/app/actions/tickets';

export default function AdminTicketStatus({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
  const t = useTranslations('Tickets');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    if (newStatus === currentStatus) return;

    setLoading(true);
    setError('');

    const res = await updateTicketStatus(ticketId, newStatus);
    
    if (res.error) {
      setError(res.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-xxs">
      <span className="text-caption-uppercase text-muted font-semibold">{t('table.status')}:</span>
      <div className="relative">
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={loading}
          className="appearance-none bg-canvas border border-hairline text-ink py-[4px] pl-xxs pr-sm text-xs font-medium focus:outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
        >
          <option value="OPEN">{t('detail.adminStatus.OPEN')}</option>
          <option value="IN_PROGRESS">{t('detail.adminStatus.IN_PROGRESS')}</option>
          <option value="CLOSED">{t('detail.adminStatus.CLOSED')}</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-muted">
          {loading ? (
            <span className="material-icons animate-spin text-[14px]">sync</span>
          ) : (
            <span className="material-icons text-[14px]">expand_more</span>
          )}
        </div>
      </div>
      {error && <span className="text-caption text-semantic-warning">{error}</span>}
    </div>
  );
}
