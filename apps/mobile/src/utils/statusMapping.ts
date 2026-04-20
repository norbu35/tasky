export type TaskStatus = 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show';

export function mapStatus(status: string): TaskStatus {
  const lower = status.toLowerCase();
  if (lower === 'assigned' || lower === 'tasker_marked_done') return 'assigned';
  if (lower === 'completed') return 'completed';
  if (lower === 'cancelled') return 'cancelled';
  if (lower === 'no_show') return 'no_show';
  return 'open';
}
