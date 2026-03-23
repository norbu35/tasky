import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrustBannerProps {
  title: string;
  description: string;
  variant?: 'default' | 'compact';
}

export function TrustBanner({ title, description, variant = 'default' }: TrustBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl p-4',
        variant === 'default' ? 'bg-trust/30 border border-trust' : 'bg-trust',
      )}
    >
      <div
        className={cn(
          'shrink-0 flex items-center justify-center',
          variant === 'default'
            ? 'w-10 h-10 rounded-lg bg-trust'
            : 'w-10 h-10 rounded-full bg-trust-muted/10',
        )}
      >
        <ShieldCheck size={20} className="text-trust-muted" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-trust-muted">{title}</p>
        <p className="text-sm text-trust-foreground leading-snug">{description}</p>
      </div>
    </div>
  );
}
