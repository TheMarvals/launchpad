'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, updateClient, deleteClient } from '@/app/actions/clients';

interface Client {
  id: string;
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  email: string | null;
  telefono: string | null;
  _count: { quotes: number };
}

interface ClientManagerProps {
  clients: Client[];
}

const emptyForm = {
  rut: '',
  razonSocial: '',
  giro: '',
  direccion: '',
  comuna: '',
  ciudad: '',
  email: '',
  telefono: '',
};

export default function ClientManager({ clients }: ClientManagerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (client: Client) => {
    setForm({
      rut: client.rut,
      razonSocial: client.razonSocial,
      giro: client.giro,
      direccion: client.direccion,
      comuna: client.comuna,
      ciudad: client.ciudad,
      email: client.email || '',
      telefono: client.telefono || '',
    });
    setEditingId(client.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rut || !form.razonSocial || !form.giro || !form.direccion || !form.comuna || !form.ciudad) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await updateClient(editingId, form);
      } else {
        await createClient(form);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id);
      setDeletingId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el cliente.');
      setDeletingId(null);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 flex items-center"
        >
          <span className="material-icons mr-2 text-sm">add</span> Nuevo Cliente
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 flex items-center">
                <span className="material-icons mr-3 text-blue-600 bg-blue-50 p-2 rounded-lg">
                  {editingId ? 'edit' : 'person_add'}
                </span>
                {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RUT *</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                  value={form.rut}
                  onChange={(e) => updateField('rut', e.target.value)}
                  placeholder="76.543.210-K"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Razón Social *</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                  value={form.razonSocial}
                  onChange={(e) => updateField('razonSocial', e.target.value)}
                  placeholder="EMPRESA SPA"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giro *</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                  value={form.giro}
                  onChange={(e) => updateField('giro', e.target.value)}
                  placeholder="Servicios Informáticos"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección *</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                  value={form.direccion}
                  onChange={(e) => updateField('direccion', e.target.value)}
                  placeholder="Av. Providencia 1234"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comuna *</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                  value={form.comuna}
                  onChange={(e) => updateField('comuna', e.target.value)}
                  placeholder="Providencia"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciudad *</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                  value={form.ciudad}
                  onChange={(e) => updateField('ciudad', e.target.value)}
                  placeholder="Santiago"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="contacto@empresa.cl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                  value={form.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center"
              >
                {isSubmitting ? (
                  <><span className="material-icons animate-spin mr-2 text-sm">sync</span> Guardando...</>
                ) : (
                  <><span className="material-icons mr-2 text-sm">{editingId ? 'save' : 'add'}</span> {editingId ? 'Actualizar' : 'Crear Cliente'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {clients.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b bg-gray-50">
                <th className="px-6 py-4">Razón Social</th>
                <th className="px-6 py-4">RUT</th>
                <th className="px-6 py-4">Giro</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Cotizaciones</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client) => (
                <tr key={client.id} className="text-sm hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold">{client.razonSocial}</td>
                  <td className="px-6 py-4">{client.rut}</td>
                  <td className="px-6 py-4 text-xs">{client.giro}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs">{client.email || '—'}</div>
                    <div className="text-xs text-gray-400">{client.telefono || ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[10px] font-bold">
                      {client._count.quotes}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        className="text-slate-500 hover:text-blue-600 transition-colors mr-1"
                        title="Portal & VPS"
                      >
                        <span className="material-icons text-[18px]">cloud</span>
                      </button>
                      <button
                        onClick={() => openEdit(client)}
                        className="text-slate-500 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <span className="material-icons text-[18px]">edit</span>
                      </button>

                      {deletingId === client.id ? (
                        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                          <span className="text-xs font-bold text-red-600 whitespace-nowrap">¿Eliminar?</span>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md transition-colors"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs font-bold text-red-400 hover:text-red-600 px-2 py-1 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(client.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-icons text-[18px]">delete_outline</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <span className="material-icons text-5xl mb-4 block opacity-30">people</span>
            No hay clientes registrados aún.
          </div>
        )}
      </div>
    </div>
  );
}
