'use client';

import React, { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { startLoginVerification } from '@/app/actions/login-otp';
import LocaleSwitcher from '@/components/LocaleSwitcher';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await startLoginVerification(email, password);
      if (res.error) {
        setError(res.error);
      } else {
        setStep(2);
        setMessage('Se ha enviado un código de 6 dígitos a tu correo electrónico.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        otp,
        redirect: false,
      });

      if (result?.error) {
        setError('Código incorrecto o expirado.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a041a] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="whitespace-nowrap font-black select-none tracking-tighter" style={{ fontSize: '600px', transform: 'rotate(-35deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#ffffff', WebkitTextStrokeWidth: '3px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>MARVAL</h1>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2" style={{ WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#ffffff', WebkitTextStrokeWidth: '1.5px' }}>MARVAL</h1>
          <div className="w-12 h-0.5 bg-blue-500 mx-auto mb-4" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Portal de Gestión Integral</p>
          <div className="mt-6 flex justify-center">
            <LocaleSwitcher />
          </div>
        </div>

        <form onSubmit={step === 1 ? handleStep1 : handleStep2} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2">
              <span className="material-icons text-[18px]">error_outline</span>
              {error}
            </div>
          )}
          {message && step === 2 && !error && (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2">
              <span className="material-icons text-[18px]">mark_email_read</span>
              {message}
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                <div className="relative">
                  <span className="material-icons absolute left-4 top-3.5 text-slate-500 text-sm">email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 pl-11 text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-600"
                    placeholder="mail@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                <div className="relative">
                  <span className="material-icons absolute left-4 top-3.5 text-slate-500 text-sm">lock</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 pl-11 text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código de Verificación (6 dígitos)</label>
              <div className="relative">
                <span className="material-icons absolute left-4 top-3.5 text-slate-500 text-sm">security</span>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 pl-11 text-white text-center font-mono text-xl tracking-[0.5em] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-600/50"
                  placeholder="000000"
                  required
                  autoFocus
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (step === 2 && otp.length !== 6)}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 shadow-xl shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center"
          >
            {isLoading ? (
              <><span className="material-icons animate-spin mr-2 text-sm">sync</span> Procesando...</>
            ) : step === 1 ? (
              <><span className="material-icons mr-2 text-sm">arrow_forward</span> Continuar</>
            ) : (
              <><span className="material-icons mr-2 text-sm">login</span> Ingresar</>
            )}
          </button>
          
          {step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setError(''); setMessage(''); }}
              disabled={isLoading}
              className="w-full text-center text-slate-400 text-[11px] font-medium uppercase tracking-widest hover:text-white transition-colors mt-4 block"
            >
              ← Volver atrás
            </button>
          )}
        </form>

        <p className="text-center text-[10px] text-slate-600 mt-8 uppercase tracking-widest">
          © 2026 Marval · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a041a]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
