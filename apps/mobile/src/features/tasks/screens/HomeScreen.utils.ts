import type { ScheduleWindow } from '@/features/tasks/components/TaskFeedFilterSheet';

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isWithinScheduleWindow(scheduledAt: string, window: ScheduleWindow): boolean {
  if (window === 'any') return true;
  const scheduled = new Date(scheduledAt);
  if (Number.isNaN(scheduled.getTime())) return true;
  const start = startOfDay(new Date());
  const end = new Date(start);
  if (window === 'today') {
    end.setDate(end.getDate() + 1);
  } else if (window === 'tomorrow') {
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 2);
  } else {
    end.setDate(end.getDate() + 7);
  }
  return scheduled >= start && scheduled < end;
}
