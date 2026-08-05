# PWA Push configuration

LAUNCHPAD stores one Web Push subscription per browser/device and associates it with the authenticated user. Push delivery requires HTTPS in production and the following server environment variables:

The installable PWA is exposed only from the localized admin dashboard. Its manifest and service-worker scope are limited to `/es/dashboard` or `/en/dashboard`; the public landing page is not part of the installed application. Existing root-scoped installations are migrated when they next load the site. Depending on the mobile browser, users may need to remove and reinstall the home-screen icon once for the new manifest scope to be reflected.

```dotenv
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:soporte@thelaunchpad.help
RESEND_WEBHOOK_SECRET=
```

Generate a VAPID key pair once:

```bash
npm run push:keys
```

Keep `VAPID_PRIVATE_KEY` server-only. The public key can be shared with browsers and is returned by the authenticated subscriptions endpoint.

Copy `RESEND_WEBHOOK_SECRET` from the signing-secret field of the Resend webhook configured for `email.received`. Production rejects unsigned inbound-email webhooks so forged requests cannot create emails or Push notifications.

After deployment, each user must press the bell button once and grant the browser notification permission. Subscriptions are device-specific, so the same user can enable Push on more than one computer or phone.

Current Push events:

- New inbound email: admins with the `emails` permission.
- New ticket or client reply: admins with the `tickets` permission.
- Admin ticket reply: active users belonging to that ticket's client.
