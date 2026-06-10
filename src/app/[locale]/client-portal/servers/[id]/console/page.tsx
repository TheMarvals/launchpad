'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVncUrl } from '@/app/actions/provider';

export default function ConsolePage() {
  const { id } = useParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Conectando...');
  const [pasteToast, setPasteToast] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    // Close context menu when clicking anywhere else
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);
  useEffect(() => {
    let rfb: any = null;

    async function loadConsole() {
      const res = await getVncUrl(id as string);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (!res.url) {
        setError('No se recibió URL de conexión.');
        setLoading(false);
        return;
      }

      try {
        // @ts-ignore - noVNC lacks official type definitions
        const { default: RFB } = await import('@novnc/novnc');

        if (!canvasRef.current) return;

        // Create noVNC connection (matching provider's configuration)
        rfb = new RFB(canvasRef.current, res.url, {
          credentials: { password: res.vncPassword || '' },
          shared: true,
          showDotCursor: true,
        });

        rfbRef.current = rfb;

        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        rfb.focusOnClick = true;

        rfb.addEventListener('connect', () => {
          setLoading(false);
          setStatus('Conectado');
        });

        rfb.addEventListener('disconnect', (e: any) => {
          setLoading(false);
          if (e.detail.clean) {
            setStatus('Desconectado');
          } else {
            setError('La conexión con el servidor se perdió. El servidor podría estar apagado o reiniciándose.');
          }
        });

        rfb.addEventListener('securityfailure', () => {
          setError('Error de autenticación con la consola del servidor.');
          setLoading(false);
        });

      } catch (e: any) {
        console.error('noVNC error:', e);
        setError('Error al inicializar la consola: ' + e.message);
        setLoading(false);
      }
    }

    loadConsole();

    return () => {
      if (rfbRef.current) {
        try { rfbRef.current.disconnect(); } catch {}
      }
    };
  }, [id]);

  // Simulate typing text character by character into the VNC session
  const typeTextIntoVnc = (text: string) => {
    if (!rfbRef.current) return;
    
    // Clean the text: remove trailing newlines/carriage returns
    const cleanText = text.replace(/[\r\n]+$/, '');
    if (!cleanText) return;
    
    // Release any held modifier keys first (Ctrl, Shift, Alt)
    // This is critical when pasting via Ctrl+V - the Ctrl key is still 
    // "pressed" in the VNC server when our handler fires
    const modifiers = [
      0xFFE1, // XK_Shift_L
      0xFFE2, // XK_Shift_R
      0xFFE3, // XK_Control_L
      0xFFE4, // XK_Control_R
      0xFFE9, // XK_Alt_L
      0xFFEA, // XK_Alt_R
    ];
    for (const mod of modifiers) {
      rfbRef.current.sendKey(mod, null, false); // release
    }
    
    // Small delay to let modifier releases propagate, then type
    setTimeout(() => {
      let i = 0;
      const sendNextChar = () => {
        if (i >= cleanText.length || !rfbRef.current) return;
        
        const char = cleanText[i];
        const code = char.charCodeAt(0);
        // ASCII printable to keysym. Other unicode use offset.
        const keysym = code >= 0x20 && code <= 0xff ? code : 0x01000000 + code;
        
        // Some VNC servers (like QEMU) reverse-map keysyms to scancodes.
        // If we don't explicitly send Shift, uppercase letters and symbols might be typed as lowercase.
        const requiresShift = /^[A-Z~!@#$%^&*()_+{}|:"<>?]+$/.test(char);
        
        if (requiresShift && rfbRef.current) {
          rfbRef.current.sendKey(0xFFE1, null, true); // XK_Shift_L down
        }
        
        // Explicitly send down then up to simulate a full keystroke
        rfbRef.current.sendKey(keysym, null, true);
        
        setTimeout(() => {
          if (rfbRef.current) {
            rfbRef.current.sendKey(keysym, null, false);
            if (requiresShift) {
              rfbRef.current.sendKey(0xFFE1, null, false); // XK_Shift_L up
            }
          }
          
          i++;
          if (i < cleanText.length) {
            setTimeout(sendNextChar, 50); // 50ms between keystrokes
          } else {
            // Restore focus to the VNC canvas so the physical keyboard (e.g. Ctrl+C) works again
            if (rfbRef.current) {
              rfbRef.current.focus();
            }
          }
        }, 20); // Hold key for 20ms
      };
      
      sendNextChar();
    }, 50);
    
    setPasteToast(true);
    setTimeout(() => setPasteToast(false), 2000);
  };

  const handleFullscreen = () => {
    if (canvasRef.current) {
      canvasRef.current.requestFullscreen?.();
    }
  };

  const handleSendCtrlAltDel = () => {
    if (rfbRef.current) {
      rfbRef.current.sendCtrlAltDel();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        typeTextIntoVnc(text);
      }
    } catch {
      const text = prompt('Pega el texto aquí para enviarlo a la consola:');
      if (text) {
        typeTextIntoVnc(text);
      }
    }
  };


  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
          <span className="material-icons text-red-500 text-6xl mb-4">error_outline</span>
          <h2 className="text-2xl font-bold mb-2">Error de Conexión</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all mb-3"
          >
            Reintentar
          </button>
          <button 
            onClick={() => router.back()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-xl transition-all"
          >
            Volver al Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded bg-blue-500/10 flex items-center justify-center">
            <span className="material-icons text-blue-500 text-[16px]">terminal</span>
          </div>
          <span className="text-slate-200 font-bold tracking-tight text-sm hidden sm:inline">Consola LAUNCHPAD</span>
          <span className="bg-slate-800 text-[9px] text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold hidden md:inline">
            Encrypted
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button onClick={handleFullscreen} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors" title="Fullscreen">
            <span className="material-icons text-[16px]">fullscreen</span>
          </button>
          <button onClick={() => window.close()} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors" title="Cerrar">
            <span className="material-icons text-[16px]">close</span>
          </button>
        </div>
      </div>
      
      {/* VNC Canvas */}
      <div 
        className="flex-1 relative bg-slate-950 overflow-hidden" 
        ref={canvasRef}
        onContextMenuCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 font-medium">{status}</p>
              <p className="text-slate-600 text-xs mt-2">Estableciendo conexión segura con el servidor...</p>
            </div>
          </div>
        )}
        
        {/* Paste Toast */}
        {pasteToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-green-600/90 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
            <span className="material-icons text-[16px]">content_paste</span>
            <span>Texto pegado en la consola</span>
          </div>
        )}
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden w-48"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center space-x-3 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              handlePasteFromClipboard();
            }}
          >
            <span className="material-icons text-[18px]">content_paste</span>
            <span className="font-medium">Pegar</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900 px-6 py-1.5 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'Conectado' ? 'bg-green-500' : status === 'Desconectado' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></span>
            <span>STATUS: {status.toUpperCase()}</span>
          </div>
          <span>PROVIDER: LAUNCHPAD CLOUD RELAY</span>
        </div>
        <div className="flex items-center space-x-4 italic">
          <span>Protección de Capa 7 Activa</span>
        </div>
      </div>
    </div>
  );
}
