'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { requestServerAction, executeServerActionWithOtp, getVncUrl, getServerLiveMetrics } from '@/app/actions/provider';
import Swal from 'sweetalert2';

export default function ServerCard({ server }: { server: any }) {
  const t = useTranslations('ClientPortal.servers');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingAction, setPendingAction] = useState<'start' | 'stop' | 'restart' | null>(null);
  const [otpError, setOtpError] = useState('');

  // Live Metrics State
  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  React.useEffect(() => {
    if (server.providerId) {
      setIsLoadingMetrics(true);
      getServerLiveMetrics(server.id).then((res) => {
        if (res.success) {
          setLiveMetrics(res.data);
        }
        setIsLoadingMetrics(false);
      }).catch(() => setIsLoadingMetrics(false));
    }
  }, [server.id, server.providerId]);

  const formatBytes = (bytes: any) => {
    const num = Number(bytes);
    if (!num || isNaN(num) || num === 0) return '0.00 TiB';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getTrafficPercentage = () => {
    if (!liveMetrics) return 0;
    const incoming = Number(liveMetrics.networkIncomingBytes) || 0;
    const outgoing = Number(liveMetrics.networkOutgoingBytes) || 0;
    const limitBytes = Number(liveMetrics.networkLimitBytes) || 1;
    let percentage = ((incoming + outgoing) / limitBytes) * 100;
    if (percentage > 100) percentage = 100;
    return percentage;
  };

  const handleOpenConsole = () => {
    window.open(`/client-portal/servers/${server.id}/console`, 'launchpad_console', 'width=1024,height=768');
  };

  const handleOpenFiles = () => {
    window.open(`/client-portal/servers/${server.id}/files`, 'launchpad_files', 'width=1200,height=800');
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
        title: t('authError') || 'Error de Autorización',
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
      setOtpError(t('otpRequired') || 'Por favor ingresa el código de 6 dígitos.');
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
        title: t('actionExecuted') || 'Acción Ejecutada',
        text: t('commandSent') || 'El comando se ha enviado exitosamente a la infraestructura.',
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
      <div className="bg-canvas-elevated border border-hairline">
        <div className="p-sm">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center space-x-xxs">
              <button 
                onClick={handleOpenConsole}
                className="w-[40px] h-[40px] bg-[#E95420]/10 flex items-center justify-center hover:bg-[#E95420]/20 transition-all cursor-pointer group"
                title={t('emergencyConsole') || 'Abrir Consola de Emergencia'}
              >
                <span className="material-icons text-[#E95420] text-[20px] group-hover:scale-110 transition-transform">terminal</span>
              </button>
              <button 
                onClick={handleOpenFiles}
                className="w-[40px] h-[40px] bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer group"
                title={t('fileManager') || 'Gestor de Archivos (SFTP)'}
              >
                <span className="material-icons text-primary text-[20px] group-hover:scale-110 transition-transform">folder_open</span>
              </button>
              <h3 className="font-semibold text-ink tracking-tight">{server.name}</h3>
            </div>
            <button className="text-muted hover:text-primary transition-colors">
              <span className="material-icons text-[18px]">edit</span>
            </button>
          </div>

          <div className="space-y-sm">
            <div className="flex items-center text-sm">
              <span className="material-icons text-muted text-[18px] mr-xxs">language</span>
              <span className="text-ink font-medium">{t('defaultDataCenter') || 'Default Data Center'}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="material-icons text-muted text-[18px] mr-xxs">dns</span>
              <div className="flex flex-col">
                <span className="text-primary font-semibold text-sm tracking-tight">
                  {server.hostname || `${server.name.toLowerCase().replace(/\s+/g, '-')}.launchpad.cloud`}
                </span>
                <span className="text-[10px] text-muted font-medium uppercase tracking-tighter mt-[2px]">
                  {t('hostIdentified') || 'Host Identificado'}
                </span>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(server.hostname || '');
                }}
                className="material-icons text-muted text-[16px] ml-auto hover:text-ink transition-colors" 
                title={t('copyHostname') || 'Copiar Hostname'}
              >
                content_copy
              </button>
            </div>
            
            {(server.cpu || server.memory || server.storage || server.bandwidth || liveMetrics || isLoadingMetrics) && (
              <div className="pt-xs border-t border-hairline space-y-sm">
                
                {(server.cpu || server.memory || server.storage || liveMetrics || isLoadingMetrics) && (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-xxs">
                      <div className="flex items-center">
                        <span className="material-icons text-primary mr-xxs text-[20px]">inventory_2</span>
                        <h4 className="text-sm font-semibold text-ink tracking-tight">{t('package') || 'Package'}</h4>
                      </div>
                      {isLoadingMetrics && <span className="material-icons animate-spin text-muted text-[14px]">sync</span>}
                    </div>
                    <div className="space-y-xxs text-sm">
                      {(server.cpu || liveMetrics?.allocatedCpu) && (
                        <div className="flex items-center">
                          <span className="text-muted w-16">{t('vcpu') || 'vCPU'}</span>
                          <span className="text-ink font-medium">
                            {server.cpu || liveMetrics?.allocatedCpu || 'Auto'} 
                            {liveMetrics && <span className="text-[10px] text-muted ml-xxs font-normal">({liveMetrics.cpuUsage}% uso)</span>}
                          </span>
                        </div>
                      )}
                      {(server.memory || liveMetrics?.allocatedRam) && (
                        <div className="flex items-center">
                          <span className="text-muted w-16">{t('ram') || 'RAM'}</span>
                          <span className="text-ink font-medium">{server.memory || (liveMetrics?.allocatedRam ? `${liveMetrics.allocatedRam} MiB` : 'Auto')}</span>
                        </div>
                      )}
                      {(server.storage || liveMetrics?.allocatedDisk) && (
                        <div className="flex items-center">
                          <span className="text-muted w-16">{t('disk') || 'Disk'}</span>
                          <span className="text-ink font-medium">
                            {server.storage || (liveMetrics?.allocatedDisk ? `${liveMetrics.allocatedDisk} GiB` : 'Auto')}
                            {liveMetrics && liveMetrics.diskBytes > 0 && <span className="text-[10px] text-muted ml-xxs font-normal">({formatBytes(liveMetrics.diskBytes)} ocupados)</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(server.bandwidth || liveMetrics || isLoadingMetrics) && (
                  <div className="bg-canvas border border-hairline p-xxs relative overflow-hidden">
                    {isLoadingMetrics && (
                      <div className="absolute inset-0 bg-canvas/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <span className="material-icons animate-spin text-primary text-[20px]">sync</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-xxs">
                      <h4 className="text-xs font-semibold text-ink">{t('totalTraffic') || 'Total traffic'}</h4>
                      <span className="text-xs font-semibold text-ink">
                        <span className="text-muted font-medium">
                          {liveMetrics ? formatBytes((Number(liveMetrics.networkIncomingBytes) || 0) + (Number(liveMetrics.networkOutgoingBytes) || 0)) : '0.00 TiB'} / 
                        </span>
                        {' '} {liveMetrics?.networkLimitBytes ? formatBytes(liveMetrics.networkLimitBytes) : server.bandwidth}
                      </span>
                    </div>
                    <div className="w-full bg-canvas-elevated h-1 mb-xxs">
                      <div className="bg-semantic-success h-1 transition-all duration-1000 ease-out" style={{ width: `${getTrafficPercentage()}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted mb-xxs">
                      <span>{t('outgoing') || 'Outgoing'}: <strong className="text-ink font-medium">{liveMetrics ? formatBytes(liveMetrics.networkOutgoingBytes) : '0.00 TiB'}</strong></span>
                      <span>{t('incoming') || 'Incoming'}: <strong className="text-ink font-medium">{liveMetrics ? formatBytes(liveMetrics.networkIncomingBytes) : '0.00 TiB'}</strong></span>
                    </div>
                    <p className="text-[10.5px] text-muted leading-tight">
                      {t('trafficWarning') || 'Si alcanzas el límite total de tráfico, el ancho de banda de la red será reducido.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center text-sm pt-xs border-t border-hairline">
              <span className="material-icons text-primary text-[16px] mr-xxs">info</span>
              <p className="text-[10px] text-muted leading-tight">
                <strong>{t('dnsLabel') || 'Configuración DNS:'}</strong>{t('dnsCloudflare') || ' Si usas Cloudflare, mantén la nube en '}<span className="text-ink font-semibold underline">{t('dnsGray') || 'Gris (DNS Only)'}</span>{t('dnsRest') || ' para evitar conflictos. Launchpad Cloud ya provee protección de Capa 7.'}
              </p>
            </div>

            {server.dueDate && (
              <div className="flex items-center text-sm pt-xs border-t border-hairline">
                <span className="material-icons text-muted text-[18px] mr-xxs">event</span>
                <span className="text-muted font-medium mr-xxs">{t('dueDateLabel') || 'Vencimiento'}:</span>
                <span className="text-ink font-semibold">
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

        <div className="bg-canvas px-sm py-xxs border-t border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-xxs">
            <span className={`w-[8px] h-[8px] ${isRunning ? 'bg-semantic-success' : 'bg-semantic-danger'} ${loadingAction ? 'animate-ping' : ''}`}></span>
            <span className="text-xs font-semibold text-ink uppercase tracking-widest">{isRunning ? (t('running') || 'Running') : (t('offline') || 'Offline')}</span>
          </div>
          
          <div className="flex items-center space-x-xxs">
            <button 
              onClick={() => initiateAction('start')}
              disabled={!!loadingAction || isRunning}
              title={t('start') || 'Start'}
              className="w-[36px] h-[36px] border border-hairline bg-canvas-elevated flex items-center justify-center text-muted hover:text-semantic-success hover:border-semantic-success/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === 'start' ? <span className="material-icons text-[18px] animate-spin">sync</span> : <span className="material-icons text-[18px]">play_arrow</span>}
            </button>
            
            <button 
              onClick={handleOpenConsole}
              title={t('secureConsole') || 'Consola Web Segura'}
              className="w-[36px] h-[36px] border border-hairline bg-canvas-elevated flex items-center justify-center text-muted hover:text-primary hover:border-primary/50 transition-all group"
            >
              <span className="material-icons text-[18px] group-hover:scale-110 transition-transform">terminal</span>
            </button>
            
            <button 
              onClick={() => initiateAction('stop')}
              disabled={!!loadingAction || !isRunning}
              title={t('stop') || 'Stop'}
              className="w-[36px] h-[36px] border border-hairline bg-canvas-elevated flex items-center justify-center text-muted hover:text-semantic-warning hover:border-semantic-warning/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === 'stop' ? <span className="material-icons text-[18px] animate-spin">sync</span> : <span className="material-icons text-[18px]">stop</span>}
            </button>
            
            <button 
              onClick={() => initiateAction('restart')}
              disabled={!!loadingAction || !isRunning}
              title={t('restart') || 'Restart'}
              className="w-[36px] h-[36px] border border-hairline bg-canvas-elevated flex items-center justify-center text-muted hover:text-primary hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === 'restart' ? <span className="material-icons text-[18px] animate-spin">sync</span> : <span className="material-icons text-[18px]">restart_alt</span>}
            </button>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-ink/90 backdrop-blur-md z-50 flex items-center justify-center p-sm">
          <div className="bg-canvas-elevated border border-hairline w-full max-w-md">
            <div className="p-sm">
              <div className="flex items-center space-x-xxs mb-xs">
                <div className="w-[40px] h-[40px] bg-semantic-warning/10 flex items-center justify-center text-semantic-warning">
                  <span className="material-icons">security</span>
                </div>
                <h3 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('securityVerification') || 'Verificación de Seguridad'}</h3>
              </div>
              
              <p className="text-sm text-muted mb-xs">
                {t('otpDescription') || 'Por motivos de seguridad, se ha enviado un código de 6 dígitos a tu correo electrónico. Ingrésalo a continuación para confirmar la acción de'} <strong className="uppercase">{pendingAction}</strong>.
              </p>

              {otpError && (
                <div className="mb-xs p-xxs bg-semantic-warning/10 text-semantic-warning text-sm flex items-start border border-semantic-warning/30">
                  <span className="material-icons text-[18px] mr-xxs">error_outline</span>
                  <span>{otpError}</span>
                </div>
              )}

              <div className="mb-xs space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">
                  {t('otpCode') || 'Código OTP'}
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={t('otpPlaceholder') || '000000'}
                  className="w-full bg-canvas border border-hairline text-ink text-center font-mono text-2xl tracking-[0.5em] py-xxs focus:border-primary outline-none transition-colors"
                />
              </div>

              <div className="flex gap-xxs">
                <button 
                  onClick={cancelOtp}
                  className="flex-1 bg-transparent border border-hairline text-ink font-semibold py-xxs hover:bg-canvas transition-colors"
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button 
                  onClick={confirmAction}
                  disabled={otpCode.length !== 6 || loadingAction === 'confirming'}
                  className="flex-1 bg-primary text-on-primary font-semibold py-xxs hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loadingAction === 'confirming' ? (
                    <span className="material-icons animate-spin text-[20px]">sync</span>
                  ) : (
                    t('confirm') || 'Confirmar'
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
