'use client';

import React, { useState } from 'react';
import { requestServerAction, executeServerActionWithOtp, getVncUrl } from '@/app/actions/provider';
import Swal from 'sweetalert2';

export default function ServerCard({ server }: { server: any }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingAction, setPendingAction] = useState<'start' | 'stop' | 'restart' | null>(null);
  const [otpError, setOtpError] = useState('');

  const handleOpenConsole = () => {
    window.open(`/client-portal/servers/${server.id}/console`, 'marval_console', 'width=1024,height=768');
  };

  const handleOpenFiles = () => {
    window.open(`/client-portal/servers/${server.id}/files`, 'marval_files', 'width=1200,height=800');
  };

  const initiateAction = async (action: 'start' | 'stop' | 'restart') => {
    setLoadingAction(action);
    setOtpError('');
    
    // Request OTP via email
    const res = await requestServerAction(server.id, action);
    setLoadingAction(null);
    
    if (res.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Autorización',
        text: res.error,
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#3b82f6',
      });
    } else {
      setPendingAction(action);
      setShowOtpModal(true);
    }
  };

  const confirmAction = async () => {
    if (!pendingAction || otpCode.length !== 6) {
      setOtpError('Por favor ingresa el código de 6 dígitos.');
      return;
    }

    setLoadingAction('confirming');
    setOtpError('');

    const res = await executeServerActionWithOtp(server.id, pendingAction, otpCode);
    
    setLoadingAction(null);

    if (res.error) {
      setOtpError(res.error);
    } else {
      // Success
      setShowOtpModal(false);
      setOtpCode('');
      setPendingAction(null);
      
      Swal.fire({
        icon: 'success',
        title: 'Acción Ejecutada',
        text: 'El comando se ha enviado exitosamente a la infraestructura.',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#10b981',
        iconColor: '#10b981',
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
    }
  };

  const cancelOtp = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setPendingAction(null);
    setOtpError('');
  };

  const isRunning = server.status === 'active';

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleOpenConsole}
                className="w-10 h-10 rounded-full bg-[#E95420]/10 flex items-center justify-center hover:bg-[#E95420]/20 transition-all cursor-pointer group"
                title="Abrir Consola de Emergencia"
              >
                <span className="material-icons text-[#E95420] text-[20px] group-hover:scale-110 transition-transform">terminal</span>
              </button>
              <button 
                onClick={handleOpenFiles}
                className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center hover:bg-blue-600/20 transition-all cursor-pointer group"
                title="Gestor de Archivos (SFTP)"
              >
                <span className="material-icons text-blue-600 text-[20px] group-hover:scale-110 transition-transform">folder_open</span>
              </button>
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">{server.name}</h3>
            </div>
            <button className="text-gray-400 hover:text-blue-600 transition-colors">
              <span className="material-icons text-[18px]">edit</span>
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center text-sm">
              <span className="material-icons text-gray-400 text-[18px] mr-3">language</span>
              <span className="text-gray-600 font-medium">Default Data Center</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="material-icons text-gray-400 text-[18px] mr-3">dns</span>
              <div className="flex flex-col">
                <span className="text-blue-600 font-bold text-sm tracking-tight">
                  {server.hostname || `${server.name.toLowerCase().replace(/\s+/g, '-')}.marval.cloud`}
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-0.5">
                  Host Identificado
                </span>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(server.hostname || '');
                  Swal.fire({
                    icon: 'success',
                    title: 'Hostname Copiado',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1500
                  });
                }}
                className="material-icons text-gray-400 text-[16px] ml-auto hover:text-gray-600 transition-colors" 
                title="Copiar Hostname"
              >
                content_copy
              </button>
            </div>
            <div className="flex items-center text-sm pt-2 border-t border-gray-100 mt-2">
              <span className="material-icons text-blue-400 text-[16px] mr-2">info</span>
              <p className="text-[10px] text-gray-500 leading-tight">
                <strong>Configuración DNS:</strong> Si usas Cloudflare, mantén la nube en <span className="text-gray-400 font-bold underline">Gris (DNS Only)</span> para evitar conflictos. Marval Cloud ya provee protección de Capa 7.
              </p>
            </div>

            {server.dueDate && (
              <div className="flex items-center text-sm pt-2 border-t border-gray-100">
                <span className="material-icons text-gray-400 text-[18px] mr-3">event</span>
                <span className="text-gray-500 font-medium mr-2">Vencimiento:</span>
                <span className="text-gray-900 font-bold">
                  {new Date(server.dueDate).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'} ${loadingAction ? 'animate-ping' : ''}`}></span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{isRunning ? 'Running' : 'Offline'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => initiateAction('start')}
              disabled={!!loadingAction || isRunning}
              title="Start" 
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === 'start' ? <span className="material-icons text-[18px] animate-spin">sync</span> : <span className="material-icons text-[18px]">play_arrow</span>}
            </button>
            
            <button 
              onClick={handleOpenConsole}
              title="Consola Web Segura" 
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group"
            >
              <span className="material-icons text-[18px] group-hover:scale-110 transition-transform">terminal</span>
            </button>
            
            <button 
              onClick={() => initiateAction('stop')}
              disabled={!!loadingAction || !isRunning}
              title="Stop" 
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === 'stop' ? <span className="material-icons text-[18px] animate-spin">sync</span> : <span className="material-icons text-[18px]">stop</span>}
            </button>
            
            <button 
              onClick={() => initiateAction('restart')}
              disabled={!!loadingAction || !isRunning}
              title="Restart" 
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === 'restart' ? <span className="material-icons text-[18px] animate-spin">sync</span> : <span className="material-icons text-[18px]">restart_alt</span>}
            </button>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <span className="material-icons">security</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Verificación de Seguridad</h3>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Por motivos de seguridad, se ha enviado un código de 6 dígitos a tu correo electrónico. 
                Ingrésalo a continuación para confirmar la acción de <strong className="uppercase">{pendingAction}</strong>.
              </p>

              {otpError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start">
                  <span className="material-icons text-[18px] mr-2">error_outline</span>
                  <span>{otpError}</span>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Código OTP
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-center font-mono text-2xl tracking-[0.5em] py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={cancelOtp}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAction}
                  disabled={otpCode.length !== 6 || loadingAction === 'confirming'}
                  className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loadingAction === 'confirming' ? (
                    <span className="material-icons animate-spin text-[20px]">sync</span>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
