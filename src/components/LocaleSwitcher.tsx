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
    <div className="flex items-center p-1 rounded-none border border-hairline bg-canvas-elevated">
      <button
        onClick={() => onLocaleChange('es')}
        className={`px-3 py-xs text-xs font-semibold tracking-wider rounded-none transition-all cursor-pointer ${
          locale === 'es'          ? 'bg-primary text-white'
          : 'text-muted hover:text-ink hover:bg-canvas'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => onLocaleChange('en')}
        className={`px-3 py-xs text-xs font-semibold tracking-wider rounded-none transition-all cursor-pointer ${
          locale === 'en'
            ? 'bg-primary text-white'
            : 'text-muted hover:text-ink hover:bg-canvas'
        }`}
      >
        EN
      </button>
    </div>
  );
}
