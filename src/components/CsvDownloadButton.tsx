'use client';

import { useState, useCallback } from 'react';

export default function CsvDownloadButton({
  href,
  locale,
}: {
  href: string;
  locale: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
    // Reset after a short delay — the download starts immediately via the anchor tag
    setTimeout(() => setLoading(false), 1500);
  }, []);

  return (
    <a
      href={href}
      download
      onClick={handleClick}
      className={`flex-1 sm:flex-initial bg-transparent border border-ink text-ink hover:bg-ink/10 px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer ${
        loading ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <span className="material-icons mr-2 text-sm">
        {loading ? 'sync' : 'download'}
      </span>
      {loading
        ? (locale === 'es' ? 'Descargando...' : 'Downloading...')
        : 'CSV'}
    </a>
  );
}
