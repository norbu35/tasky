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
    <Card className={cn('lg:sticky lg:top-20 shadow-sm', className)}>
      {title ? (
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="space-y-3">
        {primaryAction ? <div>{primaryAction}</div> : null}
        {secondaryActions ? <div className="space-y-2">{secondaryActions}</div> : null}
        {footnote ? <div className="text-xs text-muted-foreground">{footnote}</div> : null}
      </CardContent>
    </Card>
  );
}
