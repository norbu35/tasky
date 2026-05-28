import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Task, TaskFeedItem } from '../../lib/apiClient';
import { formatDate } from '../../lib/formatDate';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

type TaskData = Task | TaskFeedItem;

interface TaskCardProps {
  task: TaskData;
  onOpen: () => void;
  actionLabel?: string;
}

const STATUS_BADGE_VARIANT: Record<
  string,
  'statusOpen' | 'statusAssigned' | 'statusCompleted' | 'statusCancelled' | 'noShow' | 'secondary'
> = {
  OPEN: 'statusOpen',
  ASSIGNED: 'statusAssigned',
  COMPLETED: 'statusCompleted',
  CANCELLED: 'statusCancelled',
  NO_SHOW: 'noShow',
};

function isTask(task: TaskData): task is Task {
  return 'category_id' in task;
}

function getStatus(task: TaskData): string {
  return isTask(task) ? task.status : 'OPEN';
}

function getLocation(task: TaskData): string {
  if (isTask(task)) return task.location_text ?? '';
  return (task as TaskFeedItem).approximate_location ?? '';
}

function getScheduledAt(task: TaskData): string | null {
  if (isTask(task)) return task.scheduled_at ?? null;
  return null;
}

export function TaskCard({ task, onOpen, actionLabel }: TaskCardProps) {
  const { t } = useTranslation();

  const status = getStatus(task);
  const location = getLocation(task);
  const scheduledAt = getScheduledAt(task);
  const budget = task.budget;
  const badgeVariant = STATUS_BADGE_VARIANT[status] ?? 'secondary';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <Card
      hoverable
      className="group flex flex-col cursor-pointer overflow-hidden ring-border/20"
      role="button"
      aria-label={task.description}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={badgeVariant} size="md">
            {t(`sharedPages.status.${status}`)}
          </Badge>
          {budget != null ? (
            <div className="flex flex-col items-end">
              <span className="text-xl font-display font-bold text-primary leading-none">
                {budget.toLocaleString()}
                <span className="text-nav font-bold text-primary/60 ml-0.5 uppercase tracking-wider">
                  {t('sharedPages.currencyMNT')}
                </span>
              </span>
            </div>
          ) : (
            <span className="text-body-sm font-medium text-muted-foreground">&mdash;</span>
          )}
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-bold font-display leading-tight text-foreground transition-colors group-hover:text-primary">
          {task.description}
        </h2>
      </CardHeader>

      <CardContent className="flex-1 p-5 pt-0">
        {location && (
          <div className="flex items-center gap-2 text-body-sm text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-xl ring-1 ring-inset ring-border/10">
            <MapPin className="h-4 w-4 shrink-0 text-primary/50" />
            <span className="truncate font-medium">{location}</span>
          </div>
        )}
      </CardContent>

      {(actionLabel || scheduledAt) && (
        <CardFooter className="px-5 py-4 bg-muted/5 border-t border-border/10 flex justify-between items-center gap-3">
          {scheduledAt ? (
            <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background shadow-card ring-1 ring-inset ring-border/20">
                <CalendarDays className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <span>{formatDate(scheduledAt)}</span>
            </div>
          ) : (
            <div />
          )}
          {actionLabel && (
            <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-badge-text font-bold text-primary transition-all duration-card-expand group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
              {actionLabel}
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-sheet-close group-hover:translate-x-0.5" />
            </span>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
