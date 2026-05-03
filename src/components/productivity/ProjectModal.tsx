'use client';

import { useState, useEffect } from 'react';
import GenericModal from './GenericModal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    name: string; 
    clientName: string; 
    budget: number; 
    description: string; 
    color: string;
    deadline?: Date;
  }) => Promise<void>;
  initialData?: {
    id?: string;
    name: string;
    clientName?: string | null;
    budget?: number | null;
    description?: string | null;
    color: string;
    deadline?: Date | null;
  };
  title: string;
}

export default function ProjectModal({ isOpen, onClose, onSave, initialData, title }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    budget: 0,
    description: '',
    color: '#6366f1',
    deadline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        clientName: initialData.clientName || '',
        budget: initialData.budget || 0,
        description: initialData.description || '',
        color: initialData.color || '#6366f1',
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GenericModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Nombre del Proyecto</label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej. Desarrollo App Móvil"
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium placeholder:text-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Cliente</label>
            <input
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Nombre del cliente"
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium placeholder:text-gray-300"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Presupuesto ($)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Alcance del proyecto..."
            rows={3}
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium placeholder:text-gray-300 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Fecha Límite</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Color Identificador</label>
            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-2xl">
              {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full transition-all transform hover:scale-110 ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'opacity-60'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] bg-[#0a041a] text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-[#0a041a]/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Proyecto'}
          </button>
        </div>
      </form>
    </GenericModal>
  );
}
