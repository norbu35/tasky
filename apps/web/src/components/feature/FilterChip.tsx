import { cn } from '../../lib/utils';

export interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, active = false, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold font-sans transition-all duration-200',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-[var(--shadow-card)]'
          : 'border-border bg-card text-text-secondary hover:bg-muted',
      )}
    >
      {label}
    </button>
  );
}
