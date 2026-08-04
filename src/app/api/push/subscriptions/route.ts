import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPushPublicConfiguration } from '@/lib/push-notifications';
import { isSameOriginRequest } from '@/lib/request-security';

interface SubscriptionPayload {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
}

async function getAuthenticatedUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [subscriptionCount, configuration] = await Promise.all([
    prisma.pushSubscription.count({ where: { userId } }),
    Promise.resolve(getPushPublicConfiguration()),
  ]);

  return NextResponse.json({
    ...configuration,
    subscribed: subscriptionCount > 0,
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configuration = getPushPublicConfiguration();
  if (!configuration.configured) {
    return NextResponse.json({ error: 'Push notifications are not configured' }, { status: 503 });
  }

  let payload: SubscriptionPayload;
  try {
    payload = await request.json() as SubscriptionPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint : '';
  const p256dh = typeof payload.keys?.p256dh === 'string' ? payload.keys.p256dh : '';
  const authKey = typeof payload.keys?.auth === 'string' ? payload.keys.auth : '';

  try {
    const endpointUrl = new URL(endpoint);
    if (endpointUrl.protocol !== 'https:' || !p256dh || !authKey) {
      throw new Error('Invalid subscription');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      p256dh,
      auth: authKey,
      userAgent: request.headers.get('user-agent'),
    },
    create: {
      userId,
      endpoint,
      p256dh,
      auth: authKey,
      userAgent: request.headers.get('user-agent'),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let endpoint = '';
  try {
    const payload = await request.json() as { endpoint?: unknown };
    endpoint = typeof payload.endpoint === 'string' ? payload.endpoint : '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });

  return NextResponse.json({ success: true });
}
