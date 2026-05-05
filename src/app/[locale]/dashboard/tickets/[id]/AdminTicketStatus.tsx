'use client';

import React, { useState } from 'react';
import { updateTicketStatus } from '@/app/actions/tickets';

export default function AdminTicketStatus({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
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
    <div className="flex items-center space-x-3">
      <span className="text-sm font-semibold text-gray-700">Cambiar Estado:</span>
      <div className="relative">
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={loading}
          className="appearance-none bg-white border border-gray-300 text-gray-700 py-1.5 pl-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="OPEN">Pendiente</option>
          <option value="IN_PROGRESS">En Progreso</option>
          <option value="CLOSED">Resuelto</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          {loading ? (
            <span className="material-icons animate-spin text-[16px]">sync</span>
          ) : (
            <span className="material-icons text-[16px]">expand_more</span>
          )}
        </div>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
