'use client';

import { useEffect } from 'react';

const PUSH_MIGRATION_KEY = 'launchpad:push-scope-migration';

function normalizeScope(scope: string) {
  const withLeadingSlash = scope.startsWith('/') ? scope : `/${scope}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : '/';
}

function usesLaunchpadWorker(registration: ServiceWorkerRegistration) {
  const worker = registration.active || registration.waiting || registration.installing;
  return worker ? new URL(worker.scriptURL).pathname === '/sw.js' : false;
}

function markPushMigrationPending() {
  try {
    window.localStorage.setItem(PUSH_MIGRATION_KEY, 'pending');
  } catch {
    // Storage can be unavailable in hardened browser modes. The server-side
    // subscription record still provides a migration fallback.
  }
}

export default function PWARegistration({ scope }: { scope: string }) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const normalizedScope = normalizeScope(scope);

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(
          registrations
            .filter(usesLaunchpadWorker)
            .map((registration) => registration.unregister()),
        ));
      return;
    }

    const registerAdminWorker = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const rootScope = new URL('/', window.location.origin).href;
      const legacyRegistrations = registrations.filter(
        (registration) => registration.scope === rootScope && usesLaunchpadWorker(registration),
      );

      const legacySubscriptions = await Promise.all(
        legacyRegistrations.map((registration) => registration.pushManager.getSubscription().catch(() => null)),
      );
      if (legacySubscriptions.some(Boolean)) {
        markPushMigrationPending();
      }

      // Remove the legacy root-scoped worker so it no longer controls the
      // landing page. PushNotificationControl recreates opted-in subscriptions
      // on the new scoped registration without prompting again.
      await Promise.all(
        legacyRegistrations.map((registration) => registration.unregister()),
      );

      await navigator.serviceWorker.register('/sw.js', {
        scope: normalizedScope,
        updateViaCache: 'none',
      });
    };

    void registerAdminWorker().catch((error) => {
      console.error('[PWA] Service worker registration failed:', error);
    });
  }, [scope]);

  return null;
}
