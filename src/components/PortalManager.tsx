'use client';

import React, { useState } from 'react';
import { createClientUser, bindVpsServer } from '@/app/actions/portal';

export function AddUserModal({ clientId, onClose }: { clientId: string, onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await createClientUser(clientId, { name, email, password });
    setLoading(false);
    if (res.error) setError(res.error);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <h3 className="text-xl font-bold">Crear Usuario del Portal</h3>
        {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
        
        <div>
          <label className="text-xs font-bold text-gray-500">Nombre</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border p-2 rounded-lg mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border p-2 rounded-lg mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">Contraseña Temporal</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border p-2 rounded-lg mt-1" />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">Guardar</button>
        </div>
      </form>
    </div>
  );
}

export function AddVpsModal({ clientId, onClose }: { clientId: string, onClose: () => void }) {
  const [name, setName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await bindVpsServer(clientId, { name, providerId, ipAddress });
    setLoading(false);
    if (res.error) setError(res.error);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <h3 className="text-xl font-bold">Vincular Servidor VPS</h3>
        {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
        
        <div>
          <label className="text-xs font-bold text-gray-500">Nombre Amigable</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Hosting Liceo" required className="w-full border p-2 rounded-lg mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">ID de Proveedor</label>
          <input type="text" value={providerId} onChange={e => setProviderId(e.target.value)} placeholder="Ej: 123456" required className="w-full border p-2 rounded-lg mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">Dirección IP</label>
          <input type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)} placeholder="Ej: 192.168.1.1" className="w-full border p-2 rounded-lg mt-1" />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">Vincular</button>
        </div>
      </form>
    </div>
  );
}

export function PortalManagerButtons({ clientId }: { clientId: string }) {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showVpsModal, setShowVpsModal] = useState(false);

  return (
    <>
      <div className="flex space-x-4">
        <button onClick={() => setShowUserModal(true)} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
          + Agregar Usuario
        </button>
        <button onClick={() => setShowVpsModal(true)} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
          + Vincular VPS
        </button>
      </div>

      {showUserModal && <AddUserModal clientId={clientId} onClose={() => setShowUserModal(false)} />}
      {showVpsModal && <AddVpsModal clientId={clientId} onClose={() => setShowVpsModal(false)} />}
    </>
  );
}
