import 'server-only';

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

const PROVIDER_EVENT_STATUS: Record<string, string> = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  opened: 'DELIVERED',
  clicked: 'DELIVERED',
  delivery_delayed: 'DELAYED',
  bounced: 'BOUNCED',
  failed: 'FAILED',
  complained: 'COMPLAINED',
  suppressed: 'SUPPRESSED',
};

const FINAL_DELIVERY_STATUSES = new Set([
  'DELIVERED',
  'BOUNCED',
  'FAILED',
  'COMPLAINED',
  'SUPPRESSED',
]);

export async function syncOutboundEmailDeliveryStatus(email: {
  id: string;
  providerEmailId: string | null;
  deliveryStatus: string | null;
  deliveryUpdatedAt: Date | null;
}) {
  if (!email.providerEmailId || FINAL_DELIVERY_STATUSES.has(email.deliveryStatus || '')) {
    return {
      deliveryStatus: email.deliveryStatus,
      deliveryUpdatedAt: email.deliveryUpdatedAt,
    };
  }

  try {
    const providerEmail = await resend.emails.get(email.providerEmailId);
    const deliveryStatus = providerEmail.data?.last_event
      ? PROVIDER_EVENT_STATUS[providerEmail.data.last_event]
      : null;

    if (!deliveryStatus || deliveryStatus === email.deliveryStatus) {
      return {
        deliveryStatus: email.deliveryStatus,
        deliveryUpdatedAt: email.deliveryUpdatedAt,
      };
    }

    const deliveryUpdatedAt = new Date();
    await prisma.emailMessage.update({
      where: { id: email.id },
      data: { deliveryStatus, deliveryUpdatedAt },
    });

    return { deliveryStatus, deliveryUpdatedAt };
  } catch (error) {
    console.error(
      '[Email Delivery] Could not sync provider status:',
      error instanceof Error ? error.message : error,
    );
    return {
      deliveryStatus: email.deliveryStatus,
      deliveryUpdatedAt: email.deliveryUpdatedAt,
    };
  }
}
