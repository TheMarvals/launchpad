'use client';

import React, { useState } from 'react';
import { updateVpsService } from '@/app/actions/portal';
import Swal from 'sweetalert2';

export default function VpsEditModal({ server }: { server: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: server.name || '',
    hostname: server.hostname || '',
    ipAddress: server.ipAddress || '',
    providerId: server.providerId || '',
    dueDate: server.dueDate ? new Date(server.dueDate).toISOString().split('T')[0] : ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = {
      ...formData,
      dueDate: formData.dueDate || null,
    };

    const res = await updateVpsService(server.id, dataToSubmit);

    if (res.error) {
      Swal.fire('Error', res.error, 'error');
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Guardado',
        text: 'Datos del VPS actualizados.',
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000
      });
      setIsOpen(false);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
        title="Editar VPS"
      >
        <span className="material-icons text-[18px]">edit</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="material-icons text-blue-600 mr-2">dns</span> Editar VPS
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: Liceo A1 Web"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Hostname (Público)</label>
                <input
                  type="text"
                  name="hostname"
                  value={formData.hostname}
                  onChange={handleChange}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: srv1.marval.host"
                />
                <p className="text-xs text-gray-500 mt-1">Este nombre se mostrará al cliente en lugar de la IP.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">IP Asignada</label>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleChange}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: 192.168.1.100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ID del Proveedor (VPS)</label>
                <input
                  type="text"
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleChange}
                  required
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-yellow-50"
                  placeholder="Ej: 893450"
                />
                <p className="text-xs text-gray-500 mt-1">Este ID vincula las acciones (Start, Stop) con la API del proveedor cloud.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Vencimiento (Opcional)</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
