import type { ReactNode } from 'react';
import { ScreenFrame } from '../../layout/ScreenFrame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

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
  return (
    <ScreenFrame maxWidth="wide">
      <div className={cn('grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]', className)}>
        <section className="space-y-6">
          <Card className="border-border/60 shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
              </div>
              {primaryAction ? <div className="flex shrink-0 items-center gap-2">{primaryAction}</div> : null}
            </CardHeader>
          </Card>

          <div>{children}</div>
        </section>

        <aside className="space-y-4">{sideRail}</aside>
      </div>
    </ScreenFrame>
  );
}
