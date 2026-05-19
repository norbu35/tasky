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
        'flex flex-col items-center rounded-xl',
        'border border-border/40 bg-card shadow-card',
        'px-8 py-14 text-center',
      )}
    >
      <div
        className={cn(
          'mb-5 flex h-14 w-14 items-center justify-center',
          'rounded-2xl bg-primary/10',
          'text-primary',
          'shadow-card',
        )}
      >
        {icon}
      </div>

      <p className="mb-2 text-body font-semibold font-display text-foreground">{title}</p>

      <p className="mb-7 max-w-xs text-body-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {ctaLabel && (
        <button
          type="button"
          onClick={onCtaClick}
          className={cn(
            'h-11 rounded-xl bg-primary px-6',
            'text-button-label font-semibold text-primary-foreground',
            'shadow-fab',
            'transition-all duration-200',
            'hover:opacity-hover active:scale-pressed active:opacity-pressed',
          )}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
