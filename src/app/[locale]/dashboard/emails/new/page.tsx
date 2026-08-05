import { getActiveEmailSenderIdentities } from '@/app/actions/emails';
import EmailComposer from '@/components/emails/EmailComposer';

export default async function NewEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const identities = await getActiveEmailSenderIdentities();

  return <EmailComposer identities={identities} locale={locale} />;
}
