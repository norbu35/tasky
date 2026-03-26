import { cn } from '../../lib/utils';

export type TimelineItem = {
  label: string;
  detail?: string;
  time?: string;
  tone?: 'muted' | 'active' | 'completed' | 'warning';
};

type TimelineListProps = {
  items: TimelineItem[];
  className?: string;
};

const toneDotStyles: Record<NonNullable<TimelineItem['tone']>, string> = {
  muted: 'bg-muted-foreground',
  active: 'bg-primary',
  completed: 'bg-emerald-500',
  warning: 'bg-amber-500',
};

export function TimelineList({ items, className }: TimelineListProps) {
  return (
    <ol className={cn('space-y-4', className)}>
      {items.map((item) => (
        <li key={`${item.label}-${item.time ?? item.detail ?? ''}`} className="flex gap-4">
          <div className="flex flex-col items-center pt-1">
            <span
              aria-hidden="true"
              className={cn('h-3 w-3 rounded-full', toneDotStyles[item.tone ?? 'muted'])}
            />
            <span aria-hidden="true" className="mt-2 h-full w-px bg-border" />
          </div>
          <div className="min-w-0 flex-1 pb-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-semibold text-foreground">{item.label}</div>
              {item.time ? <div className="text-xs text-muted-foreground">{item.time}</div> : null}
            </div>
            {item.detail ? <div className="mt-1 text-sm text-muted-foreground">{item.detail}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
