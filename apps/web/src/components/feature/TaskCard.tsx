import { CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Task, TaskFeedItem } from '../../lib/apiClient';
import { formatDate } from '../../lib/formatDate';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

type TaskData = Task | TaskFeedItem;

interface TaskCardProps {
  task: TaskData;
  variant: 'grid' | 'list';
  onOpen: () => void;
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

export function TaskCard({ task, variant, onOpen }: TaskCardProps) {
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

  if (variant === 'list') {
    return (
      <Card
        className="cursor-pointer hover:-translate-y-0.5"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={handleKeyDown}
      >
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant}>{t(`sharedPages.status.${status}`)}</Badge>
            </div>
            <h2 className="truncate text-base font-semibold font-display text-foreground">
              {task.description}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {location && (
                <span className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
                  {location}
                </span>
              )}
              {scheduledAt && (
                <span className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                  {formatDate(scheduledAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {budget != null && (
              <div className="text-right">
                <span className="text-price-display font-display font-bold">
                  {budget.toLocaleString()}
                </span>{' '}
                <span className="text-caption font-medium text-muted-foreground">
                  {t('sharedPages.currencyMNT')}
                </span>
              </div>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group flex flex-col cursor-pointer hover:-translate-y-0.5"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={badgeVariant} className="text-badge-text">
            {t(`sharedPages.status.${status}`)}
          </Badge>
          {budget != null ? (
            <span className="text-price-display font-display font-bold text-foreground">
              {budget.toLocaleString()}{' '}
              <span className="text-caption font-medium text-muted-foreground">
                {t('sharedPages.currencyMNT')}
              </span>
            </span>
          ) : (
            <span className="text-body font-medium text-muted-foreground">&mdash;</span>
          )}
        </div>
        <h2 className="mt-1 line-clamp-2 text-base font-semibold font-display leading-snug text-foreground">
          {task.description}
        </h2>
      </CardHeader>

      <CardContent className="flex-1 p-4 pt-0">
        {location && (
          <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </CardContent>

      {scheduledAt && (
        <CardFooter className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatDate(scheduledAt)}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
