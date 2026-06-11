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
    <div className="relative inline-flex items-center bg-canvas/40 backdrop-blur-sm border border-hairline p-[3px] rounded-full shadow-inner overflow-hidden group">
      {/* Animated Sliding Background */}
      <div 
        className={`absolute top-[3px] bottom-[3px] w-[calc(50%-3px)] bg-primary rounded-full shadow-sm transition-transform duration-300 ease-out ${
          locale === 'en' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      
      <button
        onClick={() => onLocaleChange('es')}
        className={`relative z-10 w-11 py-[4px] text-[10px] font-bold tracking-widest transition-all duration-300 cursor-pointer ${
          locale === 'es' ? 'text-white drop-shadow-sm' : 'text-muted hover:text-ink'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => onLocaleChange('en')}
        className={`relative z-10 w-11 py-[4px] text-[10px] font-bold tracking-widest transition-all duration-300 cursor-pointer ${
          locale === 'en' ? 'text-white drop-shadow-sm' : 'text-muted hover:text-ink'
        }`}
      >
        EN
      </button>
    </div>
  );
}
