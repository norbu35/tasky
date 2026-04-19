import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCtaClick }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center',
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>

      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>

      <p className="mb-5 max-w-xs text-sm text-muted-foreground">{description}</p>

      {ctaLabel && (
        <button
          type="button"
          onClick={onCtaClick}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
