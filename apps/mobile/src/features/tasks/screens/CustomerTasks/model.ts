import { type TaskStatus, mapStatus } from '@/utils/statusMapping';

export type { TaskStatus };
export type TaskState = TaskStatus;
export { mapStatus };

export type TaskLike = {
  id: string;
  description?: string | null;
  status?: string | null;
  budget?: number | null;
  scheduled_at?: string | null;
  category?: { name?: string | null } | null;
};
