import { auth } from '@/lib/auth';
import { getProductivitySettings } from '@/app/actions/productivity';
import { getCompanyProfile, getAdmins } from '@/app/actions/settings';
import SettingsBoard from '@/components/settings/SettingsBoard';

export default async function SettingsPage() {
  const [profile, admins, productivitySettings] = await Promise.all([
    getCompanyProfile(),
    getAdmins(),
    getProductivitySettings()
  ]);

  const session = await auth();
  const currentUserId = (session?.user as any)?.id;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <SettingsBoard 
        initialProfile={profile} 
        initialAdmins={admins} 
        initialProductivitySettings={productivitySettings}
        currentUserId={currentUserId}
      />
    </div>
  );
}
