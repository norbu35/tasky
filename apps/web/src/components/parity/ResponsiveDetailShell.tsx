import type { ReactNode } from 'react';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
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
  return (
    <ScreenFrame maxWidth="wide">
      <div className={cn('grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]', className)}>
        <section className="space-y-6">
          <Card className="border-border/60 shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                {backLabel ? (
                  <Button variant="ghost" size="sm" type="button">
                    {backLabel}
                  </Button>
                ) : null}
                <div className="space-y-1">
                  <CardTitle>{title}</CardTitle>
                  {description ? <CardDescription>{description}</CardDescription> : null}
                </div>
              </div>
              {primaryAction ? <div className="flex shrink-0 items-center gap-2">{primaryAction}</div> : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </section>

        <aside className="space-y-4">{detailRail}</aside>
      </div>
    </ScreenFrame>
  );
}
