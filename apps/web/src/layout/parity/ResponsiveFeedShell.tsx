import type { ReactNode } from 'react';
import { useId } from 'react';

import { cn } from '../../lib/utils';
import { ScreenFrame } from '../ScreenFrame';

type ResponsiveFeedShellProps = {
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  sideRail?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ResponsiveFeedShell({
  title,
  description,
  primaryAction,
  sideRail,
  children,
  className,
}: ResponsiveFeedShellProps) {
  const titleId = useId();

  return (
    <ScreenFrame maxWidth="wide">
      <div className={cn('grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]', className)}>
        <section aria-labelledby={titleId} className="space-y-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <h1 id={titleId} className="font-display text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              {description ? (
                <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {primaryAction ? (
              <div className="flex shrink-0 items-center gap-2">{primaryAction}</div>
            ) : null}
          </header>

          <div className="flex flex-col gap-3">{children}</div>
        </section>

        {sideRail ? <aside className="space-y-3">{sideRail}</aside> : null}
      </div>
    </ScreenFrame>
  );
}
