import { auth } from '@/lib/auth';
import { getProductivitySettings } from '@/app/actions/productivity';
import { getCompanyProfile, getAdmins, getEmailSenderIdentities } from '@/app/actions/settings';
import SettingsBoard from '@/components/settings/SettingsBoard';

export default async function SettingsPage() {
  const [profile, admins, productivitySettings, emailSenderIdentities] = await Promise.all([
    getCompanyProfile(),
    getAdmins(),
    getProductivitySettings(),
    getEmailSenderIdentities(),
  ]);

  const session = await auth();
  const currentUserId = session?.user.id;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <SettingsBoard 
        initialProfile={profile} 
        initialAdmins={admins} 
        initialProductivitySettings={productivitySettings}
        initialEmailSenderIdentities={emailSenderIdentities}
        currentUserId={currentUserId}
      />
    </div>
  );
}
