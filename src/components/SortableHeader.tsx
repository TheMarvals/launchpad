'use client';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentDir: string;
  basePath: string;
}

export default function SortableHeader({ label, field, currentSort, currentDir, basePath }: SortableHeaderProps) {
  const isActive = currentSort === field;
  const nextDir = isActive && currentDir === 'asc' ? 'desc' : 'asc';

  return (
    <a
      href={`${basePath}?sort=${field}&dir=${nextDir}`}
      className="inline-flex items-center gap-1 hover:text-ink transition-colors"
    >
      {label}
      {isActive ? (
        <span className="material-icons text-[14px]">{currentDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
      ) : (
        <span className="material-icons text-[14px] opacity-0 group-hover:opacity-30">unfold_more</span>
      )}
    </a>
  );
}
