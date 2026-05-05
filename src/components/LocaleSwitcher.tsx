'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const onLocaleChange = (nextLocale: string) => {
    // @ts-ignore
    router.replace({ pathname, params }, { locale: nextLocale });
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
      <button
        onClick={() => onLocaleChange('es')}
        className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
          locale === 'es'
            ? 'bg-white text-blue-900 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => onLocaleChange('en')}
        className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
          locale === 'en'
            ? 'bg-white text-blue-900 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        EN
      </button>
    </div>
  );
}
