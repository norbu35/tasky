import { Star, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VerificationBadge } from './VerificationBadge';
import { cn } from '../../lib/utils';

interface TaskerProfileCardProps {
  name: string;
  avatarUrl?: string | null;
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
  isPro?: boolean;
  bio?: string;
  onMessage?: () => void;
  className?: string;
}

export function TaskerProfileCard({
  name,
  avatarUrl,
  rating,
  reviewCount,
  isVerified,
  isPro,
  bio,
  onMessage,
  className,
}: TaskerProfileCardProps) {
  const { t } = useTranslation();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('bg-card rounded-xl p-5 space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-muted"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-subtle-violet flex items-center justify-center text-primary-deep font-bold text-lg">
                {initials}
              </div>
            )}
            {isVerified && (
              <VerificationBadge type="verified" className="absolute -bottom-1 -right-1" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-foreground">{name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star size={12} className="text-accent fill-accent" />
              <span className="text-sm font-bold text-foreground">{rating}</span>
              <span className="text-xs text-muted-foreground">
                {t('customerPages.taskerProfile.reviews', '({{count}} reviews)', {
                  count: reviewCount,
                })}
              </span>
            </div>
          </div>
        </div>
        {isPro && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-trust text-trust-muted text-[10px] font-bold uppercase">
            <ShieldCheck size={12} />
            {t('customerPages.taskerProfile.verifiedTasker', 'Verified Tasker')}
          </span>
        )}
      </div>
      {bio && <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>}
      {onMessage && (
        <button
          onClick={onMessage}
          className="w-full py-3 rounded-lg border border-muted-foreground/30 text-sm font-bold text-primary-deep hover:bg-muted transition-colors"
        >
          {t('customerPages.taskerProfile.messageTasker', 'Message tasker')}
        </button>
      )}
    </div>
  );
}
