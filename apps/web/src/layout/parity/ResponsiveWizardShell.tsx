import type { ReactNode } from 'react';
import { useId } from 'react';
import { ScreenFrame } from '../ScreenFrame';
import { cn } from '../../lib/utils';

type ResponsiveWizardShellProps = {
  title: string;
  description?: string;
  stepLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ResponsiveWizardShell({
  title,
  description,
  stepLabel,
  footer,
  children,
  className,
}: ResponsiveWizardShellProps) {
  const titleId = useId();

  return (
    <ScreenFrame maxWidth="narrow">
      <section aria-labelledby={titleId} className={cn('space-y-5', className)}>
        <header className="space-y-3">
          {stepLabel ? (
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {stepLabel}
            </div>
          ) : null}
          <div className="space-y-1.5">
            <h1 id={titleId} className="text-3xl font-semibold tracking-tight">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </header>

        <div className="space-y-4">{children}</div>

        {footer ? <div className="pt-2">{footer}</div> : null}
      </section>
    </ScreenFrame>
  );
}
