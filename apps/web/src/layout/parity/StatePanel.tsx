import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { cn } from '../../lib/utils';

type StatePanelProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  tone?: 'default' | 'muted' | 'warning' | 'destructive';
  className?: string;
};

const toneStyles: Record<NonNullable<StatePanelProps['tone']>, string> = {
  default: 'border-border/60 bg-card',
  muted: 'border-border/60 bg-muted/30',
  warning: 'border-sun-light/60 bg-sun-wash/40',
  destructive: 'border-destructive/30 bg-destructive/5',
};

const toneIconWrap: Record<NonNullable<StatePanelProps['tone']>, string> = {
  default: 'bg-primary/10 text-primary',
  muted: 'bg-muted/50 text-muted-foreground',
  warning: 'bg-sun-light/30 text-sun-warm',
  destructive: 'bg-destructive/10 text-destructive',
};

export function StatePanel({
  title,
  description,
  icon,
  actions,
  tone = 'default',
  className,
}: StatePanelProps) {
  return (
    <Card className={cn('shadow-elevated', toneStyles[tone], className)}>
      <CardHeader className="space-y-4">
        {icon ? (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              toneIconWrap[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="space-y-1.5">
          <CardTitle className="font-display text-base">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-body-sm leading-relaxed">
              {description}
            </CardDescription>
          ) : null}
        </div>
      </CardHeader>
      {actions ? <CardContent className="flex flex-wrap gap-3 pt-2">{actions}</CardContent> : null}
    </Card>
  );
}
