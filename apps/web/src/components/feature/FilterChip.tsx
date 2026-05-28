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
        'shrink-0 rounded-full px-3 py-1',
        'text-badge-text font-semibold font-sans',
        'transition-all duration-badge-pop ease-badge-pop',
        'active:scale-pressed',
        active
          ? 'bg-primary text-primary-foreground shadow-card'
          : 'border border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border',
      )}
    >
      {label}
    </button>
  );
}
