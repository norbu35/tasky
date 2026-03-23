import { cn } from '../../lib/utils';

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-status-open text-status-open-foreground',
  assigned: 'bg-status-assigned text-status-assigned-foreground',
  completed: 'bg-verified text-white',
  cancelled: 'bg-muted text-muted-foreground',
  no_show: 'bg-destructive text-destructive-foreground',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase().replaceAll(' ', '_');
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[1px]',
        STATUS_STYLES[key] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {status}
    </span>
  );
}
