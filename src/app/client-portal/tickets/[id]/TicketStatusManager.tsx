'use client';

import React, { useState } from 'react';
import { updateTicketStatus } from '@/app/actions/tickets';
import Swal from 'sweetalert2';

export default function TicketStatusManager({ ticketId, currentStatus, role }: { ticketId: string, currentStatus: string, role: 'ADMIN' | 'CLIENT' }) {
  const [loading, setLoading] = useState(false);

  const handleCloseTicket = async () => {
    const result = await Swal.fire({
      title: '¿Marcar como Resuelto?',
      text: "Si tu problema ha sido solucionado, puedes cerrar este ticket.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cerrar ticket',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
    });

    if (result.isConfirmed) {
      setLoading(true);
      const res = await updateTicketStatus(ticketId, 'CLOSED');
      setLoading(false);

      if (res.error) {
        Swal.fire('Error', res.error, 'error');
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Ticket Cerrado',
          text: 'Gracias por ponerte en contacto con nosotros.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
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
        className="text-gray-500 hover:text-green-600 font-medium flex items-center transition-colors disabled:opacity-50"
      >
        <span className="material-icons text-[18px] mr-1">check_circle_outline</span>
        Marcar como resuelto
      </button>
    );
  }

  // Admin controls would go here (dropdown to change status)
  return null;
}
