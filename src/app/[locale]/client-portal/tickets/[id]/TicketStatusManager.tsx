'use client';

import React, { useState } from 'react';
import { updateTicketStatus } from '@/app/actions/tickets';
import Swal from 'sweetalert2';
import { swalTheme, swalToastTheme } from '@/lib/swal-theme';
import { useTranslations } from 'next-intl';

export default function TicketStatusManager({ ticketId, currentStatus, role }: { ticketId: string, currentStatus: string, role: 'ADMIN' | 'CLIENT' }) {
  const t = useTranslations('ClientPortal');
  const [loading, setLoading] = useState(false);

  const handleCloseTicket = async () => {
    const result = await Swal.fire({
      title: t('tickets.statusManager.closeQuestion'),
      text: t('tickets.statusManager.closeMessage'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('tickets.statusManager.closeConfirm'),
      cancelButtonText: t('tickets.statusManager.closeCancel'),
      background: '#181818',
      color: '#ffffff',
    });

    if (result.isConfirmed) {
      setLoading(true);
      const res = await updateTicketStatus(ticketId, 'CLOSED');
      setLoading(false);

      if (res.error) {
        Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: res.error });
      } else {
        Swal.fire({
          ...swalToastTheme,
          icon: 'success',
          title: t('tickets.statusManager.closedSuccess'),
          text: t('tickets.statusManager.closedThankYou'),
          timer: 3000,
        });
      }
    }
  };

  if (role === 'CLIENT') {
    if (currentStatus === 'CLOSED') return null;
    
    return (
      <button 
        onClick={handleCloseTicket}
        disabled={loading}
        className="px-xs py-xs text-muted hover:text-semantic-success font-medium flex items-center transition-colors disabled:opacity-50 text-sm"
      >
        <span className="material-icons text-[18px] mr-xxs">check_circle_outline</span>
        {t('tickets.statusManager.closeText')}
      </button>
    );
  }

  // Admin controls would go here (dropdown to change status)
  return null;
}
