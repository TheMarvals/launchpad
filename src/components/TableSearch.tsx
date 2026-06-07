'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';

interface TableSearchProps {
  placeholder?: string;
}

export default function TableSearch({ placeholder = 'Search...' }: TableSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') || '');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    params.delete('page'); // Reset to page 1 when searching
    router.push(`?${params.toString()}`);
  }, [value, searchParams, router]);

  const handleClear = useCallback(() => {
    setValue('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none pr-sm"
      />
      <div className="absolute right-xxs top-1/2 -translate-y-1/2 flex items-center gap-[2px]">
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="w-[24px] h-[24px] flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <span className="material-icons text-sm">close</span>
          </button>
        )}
        <button
          type="submit"
          className="w-[24px] h-[24px] flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <span className="material-icons text-sm">search</span>
        </button>
      </div>
    </form>
  );
}
