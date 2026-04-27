interface TaskerProfileRouteSeed {
  id?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  rating_avg?: number | null;
  completed_tasks?: number | null;
  is_pro?: boolean | null;
  created_at?: string | null;
}

export interface TaskerProfileRouteParams {
  taskerId?: string;
  id?: string;
  taskerName?: string;
  taskerAvatar?: string;
  taskerBio?: string;
  taskerRating?: string;
  taskerCompletedTasks?: string;
  taskerVerified?: string;
  taskerCreatedAt?: string;
}

export function buildTaskerProfileRoute(seed: TaskerProfileRouteSeed) {
  return {
    pathname: '/(customer)/taskers/[taskerId]',
    params: {
      taskerId: seed.id ?? '',
      taskerName: seed.full_name ?? '',
      taskerAvatar: seed.avatar_url ?? '',
      taskerBio: seed.bio ?? '',
      taskerRating: seed.rating_avg == null ? '' : String(seed.rating_avg),
      taskerCompletedTasks: seed.completed_tasks == null ? '' : String(seed.completed_tasks),
      taskerVerified: seed.is_pro ? 'true' : 'false',
      taskerCreatedAt: seed.created_at ?? '',
    },
  } as const;
}

export function numberFromRouteParam(value?: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
