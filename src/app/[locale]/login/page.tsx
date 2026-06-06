'use client';

import React, { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';

import { startLoginVerification, verifyGateTokenAction } from '@/app/actions/login-otp';
import LocaleSwitcher from '@/components/LocaleSwitcher';

function LoginForm() {
  const t = useTranslations('Login');
  const g = useTranslations('Gate');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // Gate token verification (replaces direct ?email=)
  const gateToken = searchParams.get('token') || '';
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState(false);

  // Verify the gate token on mount
  React.useEffect(() => {
    if (!gateToken) {
      setVerifying(false);
      setTokenError(true);
      return;
    }
    verifyGateTokenAction(gateToken).then((res) => {
      if (res.email) {
        setVerifiedEmail(res.email);
      } else {
        setTokenError(true);
      }
      setVerifying(false);
    }).catch(() => {
      setTokenError(true);
      setVerifying(false);
    });
  }, [gateToken]);

  // Hooks must be declared before any early return (Rules of Hooks)
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Set email from verified token once resolved
  React.useEffect(() => {
    if (verifiedEmail) setEmail(verifiedEmail);
  }, [verifiedEmail]);

  // Show verifying/error state while token is being checked
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex items-center gap-xxs text-muted">
          <span className="material-icons animate-spin text-[20px]">sync</span>
          <span className="text-sm font-medium">Verificando acceso...</span>
        </div>
      </div>
    );
  }

  // Protect direct access — only allow if gate token is valid
  if (!verifiedEmail || tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas relative overflow-hidden font-sans">
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="whitespace-nowrap font-medium select-none tracking-[-1.6px]" style={{ fontSize: '320px', transform: 'rotate(-15deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#ffffff', WebkitTextStrokeWidth: '2px', lineHeight: 1 }}>
              LAUNCHPAD
            </h1>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[440px] mx-xxs text-center">
          <div className="bg-surface-card border border-hairline rounded-lg p-md md:p-lg shadow-medium">
            <div className="w-[56px] h-[56px] rounded-sm bg-semantic-warning/10 flex items-center justify-center mx-auto mb-sm">
              <span className="material-icons text-semantic-warning text-[28px]">lock</span>
            </div>
            <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider mb-xxs">{g('restrictedTitle')}</h2>
            <p className="text-body text-muted text-sm leading-relaxed mb-md">
              {g('restrictedMessage')}
            </p>
            <Link
              href="/"
              className="inline-flex items-center bg-primary hover:bg-primary-hover text-on-primary px-lg h-[48px] rounded-sm text-xs font-bold uppercase tracking-[1.4px] transition-colors"
            >
              <span className="material-icons mr-xxs text-[16px]">arrow_back</span>
              {g('backToHome')}
            </Link>
          </div>
          <p className="text-center text-caption text-muted mt-md uppercase tracking-widest">
            © 2026 Launchpad · {t('footer')}
          </p>
        </div>
      </div>
    );
  }

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await startLoginVerification(email, password);
      if (res.error) {
        setError(res.error === 'INVALID_CREDENTIALS' ? t('invalidCredentials') : t('serverError'));
      } else {
        setStep(2);
        setMessage(t('otpSent'));
      }
    } catch {
      setError(t('connectionError'));
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
        setError(t('invalidCode'));
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="whitespace-nowrap font-medium select-none tracking-[-1.6px]" style={{ fontSize: '320px', transform: 'rotate(-15deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#ffffff', WebkitTextStrokeWidth: '2px', lineHeight: 1 }}>
            LAUNCHPAD
          </h1>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[440px] mx-xxs">
        <div className="text-center mb-lg">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-xxxs stroke-text">
            LAUNCHPAD
          </h1>
          <p className="text-caption-uppercase tracking-[0.15em] text-muted font-medium mb-sm">
            {t('subtitle')}
          </p>
          <div className="mt-xs flex justify-center">
            <LocaleSwitcher />
          </div>
        </div>

        <form onSubmit={step === 1 ? handleStep1 : handleStep2} className="bg-surface-card border border-hairline rounded-lg p-md md:p-lg shadow-medium space-y-xs">
          {error && (
            <div className="bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warning text-sm font-medium px-xs py-xxs rounded-sm text-center flex items-center justify-center gap-xxs">
              <span className="material-icons text-[18px]">error_outline</span>
              {error}
            </div>
          )}
          {message && step === 2 && !error && (
            <div className="bg-semantic-info/10 border border-semantic-info/20 text-semantic-info text-sm font-medium px-xs py-xxs rounded-sm text-center flex items-center justify-center gap-xxs">
              <span className="material-icons text-[18px]">mark_email_read</span>
              {t('otpSent')}
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="space-y-xxxs">
                <label className="text-caption-uppercase text-muted tracking-wider block">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <span className="material-icons absolute left-xxs top-[14px] text-muted text-sm">email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-canvas border border-hairline rounded-sm p-xxs pl-[40px] text-ink text-sm focus:border-primary focus:shadow-[0_0_0_2px_rgba(0,98,255,0.15)] outline-none transition-all placeholder:text-muted h-[48px]"
                    placeholder="mail@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-xxxs">
                <label className="text-caption-uppercase text-muted tracking-wider block">
                  {t('passwordLabel')}
                </label>
                <div className="relative">
                  <span className="material-icons absolute left-xxs top-[14px] text-muted text-sm">lock</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-canvas border border-hairline rounded-sm p-xxs pl-[40px] text-ink text-sm focus:border-primary focus:shadow-[0_0_0_2px_rgba(0,98,255,0.15)] outline-none transition-all placeholder:text-muted h-[48px]"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-xxxs">
              <label className="text-caption-uppercase text-muted tracking-wider block">
                {t('otpLabel')}
              </label>
              <div className="relative">
                <span className="material-icons absolute left-xxs top-[14px] text-muted text-sm">security</span>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}                    className="w-full bg-canvas border border-hairline rounded-sm p-xxs pl-[40px] text-ink text-center font-mono text-xl tracking-[0.5em] focus:border-primary focus:shadow-[0_0_0_2px_rgba(0,98,255,0.15)] outline-none transition-all placeholder:text-muted/30 h-[48px]"
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
            className="w-full bg-primary text-on-primary font-bold text-sm uppercase tracking-[1.4px] hover:bg-primary-hover transition-all disabled:opacity-50 h-[48px] rounded-sm active:scale-[0.98] flex items-center justify-center cursor-pointer"
          >
            {isLoading ? (
              <><span className="material-icons animate-spin mr-xxs text-sm">sync</span> ...</>
            ) : step === 1 ? (
              <><span className="material-icons mr-xxs text-sm">arrow_forward</span> {t('submitEmail')}</>
            ) : (
              <><span className="material-icons mr-xxs text-sm">login</span> {t('submitOtp')}</>
            )}
          </button>
          
          {step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setError(''); setMessage(''); }}
              disabled={isLoading}
              className="w-full text-center text-muted text-caption-uppercase tracking-wider hover:text-white transition-colors mt-xxs block cursor-pointer"
            >
              ← {t('back')}
            </button>
          )}
        </form>

        <p className="text-center text-caption text-muted mt-md uppercase tracking-widest">
          © 2026 Launchpad · {t('footer')}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="w-[48px] h-[48px] border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
