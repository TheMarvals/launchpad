'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const PUSH_MIGRATION_KEY = 'launchpad:push-scope-migration';

function hasPendingPushMigration() {
  try {
    return window.localStorage.getItem(PUSH_MIGRATION_KEY) === 'pending';
  } catch {
    return false;
  }
}

function clearPendingPushMigration() {
  try {
    window.localStorage.removeItem(PUSH_MIGRATION_KEY);
  } catch {
    // Ignore unavailable storage; the active scoped subscription is enough.
  }
}

interface PushStatusResponse {
  configured: boolean;
  publicKey: string | null;
  subscribed: boolean;
}

function urlBase64ToUint8Array(base64String: string) {
  const clean = base64String.trim().replace(/^["']|["']$/g, '');
  const padding = '='.repeat((4 - (clean.length % 4)) % 4);
  const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

function normalizeScope(scope: string) {
  const withLeadingSlash = scope.startsWith('/') ? scope : `/${scope}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : '/';
}

async function findScopedServiceWorkerRegistration(scope: string) {
  const expectedScope = new URL(normalizeScope(scope), window.location.origin).href;
  const registrations = await navigator.serviceWorker.getRegistrations();
  return registrations.find((registration) => registration.scope === expectedScope) ?? null;
}

async function getServiceWorkerRegistration(scope: string) {
  const existingRegistration = await findScopedServiceWorkerRegistration(scope);
  if (existingRegistration) return existingRegistration;

  return navigator.serviceWorker.register('/sw.js', {
    scope: normalizeScope(scope),
    updateViaCache: 'none',
  });
}

async function persistSubscription(subscription: PushSubscription) {
  const response = await fetch('/api/push/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error || 'Unable to save push subscription');
  }
}

function subscriptionUsesKey(subscription: PushSubscription, publicKey: string) {
  const subscriptionKey = subscription.options.applicationServerKey;
  if (!subscriptionKey) return false;

  const expectedKey = urlBase64ToUint8Array(publicKey);
  const currentKey = new Uint8Array(subscriptionKey);
  return currentKey.length === expectedKey.length
    && currentKey.every((value, index) => value === expectedKey[index]);
}

function formatPushError(error: unknown, isSpanish: boolean) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  if (/push service error/i.test(rawMessage)) {
    return isSpanish
      ? 'Error del servicio push. En Brave: activa "Usar los servicios de Google para mensajería push" en brave://settings/privacy y reinicia el navegador.'
      : 'Push service error. In Brave: enable "Use Google services for push messaging" in brave://settings/privacy and restart browser.';
  }
  if (/permission denied/i.test(rawMessage)) {
    return isSpanish ? 'Permiso de notificaciones denegado' : 'Notification permission denied';
  }
  return rawMessage || (isSpanish ? 'Error al configurar notificaciones' : 'Error configuring notifications');
}

export default function PushNotificationControl({ locale, scope }: { locale: string; scope: string }) {
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isSpanish = locale === 'es';
  const supported = useSyncExternalStore(
    () => () => undefined,
    () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
    () => false,
  );

  useEffect(() => {
    if (!supported) return;

    const loadStatus = async () => {
      try {
        const response = await fetch('/api/push/subscriptions', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load push settings');

        const status = await response.json() as PushStatusResponse;
        let registration = await findScopedServiceWorkerRegistration(scope);
        let currentSubscription = await registration?.pushManager.getSubscription() ?? null;

        if (
          currentSubscription
          && status.configured
          && status.publicKey
          && !subscriptionUsesKey(currentSubscription, status.publicKey)
        ) {
          try {
            await currentSubscription.unsubscribe();
          } catch {
            // Ignore unsubscribe error
          }
          currentSubscription = null;
        }

        // Auto-subscribe or restore push subscription whenever permission is granted
        if (
          !currentSubscription
          && status.configured
          && status.publicKey
          && Notification.permission === 'granted'
        ) {
          try {
            registration = registration || await getServiceWorkerRegistration(scope);
            currentSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(status.publicKey),
            });
          } catch (subscribeError) {
            console.warn('[Push] Auto-subscribe error:', subscribeError);
            setError(formatPushError(subscribeError, isSpanish));
          }
        }

        if (currentSubscription) {
          try {
            await persistSubscription(currentSubscription);
            clearPendingPushMigration();
            setError('');
          } catch (persistError) {
            console.warn('[Push] Persist subscription error:', persistError);
          }
        }

        setConfigured(status.configured);
        setPublicKey(status.publicKey);
        setSubscription(currentSubscription);
      } catch (loadError) {
        console.error('[Push] Failed to load notification status:', loadError);
        setError(formatPushError(loadError, isSpanish));
      }
    };

    void loadStatus();
  }, [isSpanish, scope, supported]);

  const enableNotifications = async () => {
    if (!publicKey) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error(isSpanish ? 'Permiso de notificaciones denegado' : 'Notification permission denied');
    }

    const registration = await getServiceWorkerRegistration(scope);
    const currentSubscription = await registration.pushManager.getSubscription();
    const nextSubscription = currentSubscription || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await persistSubscription(nextSubscription);

    setSubscription(nextSubscription);
    setError('');
  };

  const disableNotifications = async () => {
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    const response = await fetch('/api/push/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) throw new Error('Unable to remove push subscription');

    await subscription.unsubscribe();
    setSubscription(null);
    setError('');
  };

  const toggleNotifications = async () => {
    setBusy(true);
    setError('');

    try {
      if (subscription) {
        await disableNotifications();
      } else {
        await enableNotifications();
      }
    } catch (toggleError) {
      console.error('[Push] Failed to update notifications:', toggleError);
      setError(formatPushError(toggleError, isSpanish));
    } finally {
      setBusy(false);
    }
  };

  if (supported === false) return null;

  const denied = typeof Notification !== 'undefined' && Notification.permission === 'denied';
  const disabled = busy || !configured || denied;
  const title = error
    || (!configured
      ? (isSpanish ? 'Configura las claves VAPID para activar Push' : 'Configure VAPID keys to enable Push')
      : denied
        ? (isSpanish ? 'Notificaciones bloqueadas en el navegador' : 'Notifications are blocked in the browser')
        : subscription
          ? (isSpanish ? 'Desactivar notificaciones Push' : 'Disable Push notifications')
          : (isSpanish ? 'Activar notificaciones de correos y tickets' : 'Enable email and ticket notifications'));

  return (
    <button
      type="button"
      onClick={toggleNotifications}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`relative w-10 h-10 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed ${
        error
          ? 'text-red-400'
          : subscription
            ? 'text-primary'
            : 'text-muted hover:text-primary'
      } disabled:opacity-50`}
    >
      <span className={`material-icons text-[20px] ${busy ? 'animate-pulse' : ''}`}>
        {subscription ? 'notifications_active' : 'notifications_none'}
      </span>
      {subscription && (
        <span className="absolute top-[7px] right-[7px] w-2 h-2 rounded-full bg-emerald-400 border border-canvas" />
      )}
    </button>
  );
}
