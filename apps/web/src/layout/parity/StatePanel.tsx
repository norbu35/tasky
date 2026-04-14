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
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  destructive: 'border-destructive/30 bg-destructive/5 text-destructive-foreground',
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
    <Card className={cn('shadow-sm', toneStyles[tone], className)}>
      <CardHeader className="space-y-4">
        {icon ? <div className="flex items-center gap-3">{icon}</div> : null}
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
      </CardHeader>
      {actions ? <CardContent className="flex flex-wrap gap-3">{actions}</CardContent> : null}
    </Card>
  );
}
