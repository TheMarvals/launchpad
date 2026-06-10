import { Link } from '@/i18n/routing';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPillsProps {
  basePath: string;
  filterKey: string;
  options: FilterOption[];
  currentFilter: string;
  sortField: string;
  sortDir: string;
  locale: string;
  /** Extra params to preserve across filter changes (e.g. another active filter) */
  extraParams?: Record<string, string>;
  /** Total count to show in "All" label */
  totalCount?: number;
  /** Filtered count to show in subtitle */
  filteredCount?: number;
}

export default function FilterPills({
  basePath,
  filterKey,
  options,
  currentFilter,
  sortField,
  sortDir,
  locale,
  extraParams,
  totalCount,
  filteredCount,
}: FilterPillsProps) {
  const buildHref = (value: string) => {
    const params = new URLSearchParams();
    if (sortField) params.set('sort', sortField);
    if (sortDir) params.set('dir', sortDir);
    if (value) params.set(filterKey, value);
    // Preserve extra params (e.g. another filter that's still active)
    if (extraParams) {
      for (const [key, val] of Object.entries(extraParams)) {
        if (val) params.set(key, val);
      }
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  };

  const clearHref = () => {
    const params = new URLSearchParams();
    if (sortField) params.set('sort', sortField);
    if (sortDir) params.set('dir', sortDir);
    // Preserve extra params but NOT this filterKey
    if (extraParams) {
      for (const [key, val] of Object.entries(extraParams)) {
        if (val) params.set(key, val);
      }
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="flex items-center gap-xxs flex-wrap">
      {options.map((option) => {
        const isActive = currentFilter === option.value;
        return (
          <Link
            key={option.value || 'all'}
            href={buildHref(option.value)}
            className={`px-sm py-xs text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              isActive
                ? 'bg-ink text-canvas border-ink'
                : 'bg-transparent text-muted border-hairline hover:text-ink hover:border-ink/30'
            }`}
          >
            {option.label}
            {isActive && filteredCount !== undefined && totalCount !== undefined && (
              <span className="ml-1 text-[9px] opacity-70">({filteredCount}/{totalCount})</span>
            )}
          </Link>
        );
      })}
      {currentFilter && (
        <Link
          href={clearHref()}
          className="px-sm py-xs text-[10px] font-bold uppercase tracking-wider border border-transparent text-muted/50 hover:text-semantic-danger hover:border-semantic-danger/30 transition-colors flex items-center gap-[2px]"
        >
          <span className="material-icons text-[12px]">close</span>
          {locale === 'es' ? 'Limpiar' : 'Clear'}
        </Link>
      )}
    </div>
  );
}
