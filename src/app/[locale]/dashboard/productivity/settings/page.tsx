import { getProductivitySettings } from '@/app/actions/productivity';
import ProductivitySettingsBoard from '@/components/productivity/ProductivitySettingsBoard';

export default async function SettingsPage() {
  const settings = await getProductivitySettings();

  return <ProductivitySettingsBoard initialSettings={settings} />;
}
