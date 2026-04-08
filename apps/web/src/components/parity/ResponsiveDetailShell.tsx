import type { ReactNode } from 'react';
import { useId } from 'react';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

type ResponsiveDetailShellProps = {
  title: string;
  description?: string;
  backLabel?: string;
  primaryAction?: ReactNode;
  detailRail?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ResponsiveDetailShell({
  title,
  description,
  backLabel,
  primaryAction,
  detailRail,
  children,
  className,
}: ResponsiveDetailShellProps) {
  const titleId = useId();

  return (
    <ScreenFrame maxWidth="wide">
      <div className={cn('grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]', className)}>
        <section aria-labelledby={titleId} className="space-y-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              {backLabel ? (
                <Button variant="ghost" size="sm" type="button">
                  {backLabel}
                </Button>
              ) : null}
              <div className="space-y-1.5">
                <h1 id={titleId} className="text-3xl font-semibold tracking-tight">
                  {title}
                </h1>
                {description ? (
                  <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>
            {primaryAction ? (
              <div className="flex shrink-0 items-center gap-2">{primaryAction}</div>
            ) : null}
          </header>

          <div className="space-y-4">{children}</div>
        </section>

        {detailRail ? <aside className="space-y-4">{detailRail}</aside> : null}
      </div>
    </ScreenFrame>
  );
}
