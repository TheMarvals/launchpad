'use client';

import React, { useState } from 'react';
import { sendTicketMessage } from '@/app/actions/tickets';

export default function TicketReplyForm({ ticketId, buttonText = "Enviar Respuesta" }: { ticketId: string, buttonText?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    const res = await sendTicketMessage(ticketId, message);

    if (res.error) {
      setError(res.error);
    } else {
      setMessage('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={4}
        placeholder="Escribe tu mensaje aquí..."
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none resize-y text-gray-900"
      ></textarea>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <span className="material-icons animate-spin mr-2 text-[18px]">sync</span>
          ) : (
            <span className="material-icons mr-2 text-[18px]">send</span>
          )}
          {buttonText}
        </button>
      </div>
    </form>
  );
}
