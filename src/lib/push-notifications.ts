import webPush from 'web-push';
import { prisma } from '@/lib/prisma';

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

interface PushConfiguration {
  publicKey: string;
  privateKey: string;
  subject: string;
}

function getPushConfiguration(): PushConfiguration | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:soporte@thelaunchpad.help';

  if (!publicKey || !privateKey) return null;

  return { publicKey, privateKey, subject };
}

export function getPushPublicConfiguration() {
  const configuration = getPushConfiguration();
  return {
    configured: Boolean(configuration),
    publicKey: configuration?.publicKey ?? null,
  };
}

function getPushStatusCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return null;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === 'number' ? statusCode : null;
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const configuration = getPushConfiguration();
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (!configuration || uniqueUserIds.length === 0) {
    return { sent: 0, failed: 0, disabled: !configuration };
  }

  webPush.setVapidDetails(
    configuration.subject,
    configuration.publicKey,
    configuration.privateKey,
  );

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: uniqueUserIds } },
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
        {
          TTL: 60 * 60,
          urgency: 'high',
        },
      );
      sent += 1;
    } catch (error) {
      failed += 1;
      const statusCode = getPushStatusCode(error);

      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
        return;
      }

      console.error('[Push] Failed to deliver notification:', {
        subscriptionId: subscription.id,
        statusCode,
      });
    }
  }));

  return { sent, failed, disabled: false };
}

export async function notifyAdminsWithPermission(
  permission: string,
  payload: PushPayload,
  excludeUserId?: string,
) {
  const users = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      isActive: true,
      permissions: { has: permission },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  return sendPushToUsers(users.map((user) => user.id), payload);
}

export async function notifyClientUsers(
  clientId: string,
  payload: PushPayload,
  excludeUserId?: string,
) {
  const users = await prisma.user.findMany({
    where: {
      clientId,
      isActive: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  return sendPushToUsers(users.map((user) => user.id), payload);
}
