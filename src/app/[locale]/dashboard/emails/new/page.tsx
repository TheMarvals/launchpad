import { prisma } from '@/lib/prisma';
import { getActiveEmailSenderIdentities } from '@/app/actions/emails';
import EmailComposer from '@/components/emails/EmailComposer';

export default async function NewEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ pitchId?: string; to?: string }>;
}) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};
  const [identities, pitches] = await Promise.all([
    getActiveEmailSenderIdentities(),
    prisma.pitch.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        subtitle: true,
        theme: true,
        clientName: true,
        client: {
          select: {
            id: true,
            razonSocial: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            cargo: true,
            email: true,
          },
        },
        slides: true,
      },
    }),
  ]);

  return (
    <EmailComposer
      identities={identities}
      pitches={pitches}
      initialPitchId={query.pitchId}
      initialTo={query.to}
      locale={locale}
    />
  );
}
