import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ReviewCardProps {
  reviewerInitials: string;
  reviewerName: string;
  rating: number;
  comment: string;
  timeAgo: string;
  featured?: boolean;
}

export function ReviewCard({
  reviewerInitials,
  reviewerName,
  rating,
  comment,
  timeAgo,
  featured,
}: ReviewCardProps) {
  return (
    <div
      className={cn(
        'bg-muted rounded-xl p-5 space-y-3',
        featured && 'border-l-4 border-l-primary-deep pl-6',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-subtle-violet flex items-center justify-center text-xs font-bold text-muted-foreground">
            {reviewerInitials}
          </div>
          <span className="font-bold text-foreground">{reviewerName}</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < rating ? 'text-accent fill-accent' : 'text-chip-inactive'}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground italic leading-relaxed">{comment}</p>
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
        {timeAgo}
      </p>
    </div>
  );
}
