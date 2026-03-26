import type { ReactNode } from 'react';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
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
  return (
    <ScreenFrame maxWidth="narrow">
      <div className={cn('space-y-6', className)}>
        <Card className="border-border/60 shadow-md">
          <CardHeader className="space-y-3">
            {stepLabel ? (
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {stepLabel}
              </div>
            ) : null}
            <div className="space-y-1">
              <CardTitle>{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer ? <div>{footer}</div> : null}
      </div>
    </ScreenFrame>
  );
}
