import { Clock, MapPin } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export interface FeedCardProps {
  category: string;
  description: string;
  budget: string;
  location: string;
  onApply?: () => void;
}

export function FeedCard({ category, description, budget, location, onApply }: FeedCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border/60 shadow-elevated',
        'flex flex-col overflow-hidden transition-all duration-300',
        'hover:shadow-deep hover:-translate-y-0.5',
      )}
    >
      <div className="border-b border-border/30 bg-muted/40 px-4 pb-3 pt-4">
        <div className="mb-2.5 flex gap-1.5">
          <Badge variant="secondary">{category}</Badge>
          <Badge variant="outline">Open</Badge>
        </div>

        <p className="mb-2 line-clamp-2 text-base font-medium leading-snug font-display text-foreground">
          {description}
        </p>

        <p className="text-2xl font-bold font-display text-foreground">
          {budget} <span className="text-[13px] font-normal text-text-secondary">MNT</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-3.5">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border border-border/30 bg-muted/50',
            'px-2.5 py-2 text-[13px] font-medium font-sans text-foreground',
          )}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate">{location}</span>
        </div>

        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border border-border/30 bg-muted/50',
            'px-2.5 py-2 text-[13px] font-medium font-sans text-foreground',
          )}
        >
          <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span>Fixed price</span>
        </div>
      </div>

      <div className="border-t border-border/40 bg-muted/30 px-4 py-3">
        <Button onClick={onApply} className="w-full shadow-fab">
          View Details &amp; Apply
        </Button>
      </div>
    </div>
  );
}
