import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { cn } from '../../lib/utils';

type ActionRailProps = {
  title?: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  footnote?: ReactNode;
  className?: string;
};

export function ActionRail({
  title,
  primaryAction,
  secondaryActions,
  footnote,
  className,
}: ActionRailProps) {
  return (
    <Card className={cn('lg:sticky lg:top-20 shadow-elevated', className)}>
      {title ? (
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4">
        {primaryAction ? <div className="rounded-xl bg-muted/20 p-3">{primaryAction}</div> : null}
        {secondaryActions ? (
          <div className="space-y-2 border-t border-border/30 pt-4">{secondaryActions}</div>
        ) : null}
        {footnote ? (
          <div className="border-t border-border/20 pt-3 text-caption text-muted-foreground">
            {footnote}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
