import { MessageSquare } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card, CardContent } from '../ui/card';

export interface ConversationCardProps {
  title: string;
  subtitle?: string;
  timestamp?: string;
  unreadCount?: number;
  isSelected?: boolean;
  onOpen: () => void;
  className?: string;
}

export function ConversationCard({
  title,
  subtitle,
  timestamp,
  unreadCount,
  isSelected,
  onOpen,
  className,
}: ConversationCardProps) {
  return (
    <Card
      hoverable
      className={cn(
        'group cursor-pointer transition-all duration-300',
        isSelected
          ? 'ring-2 ring-primary bg-primary/5 shadow-elevated'
          : 'hover:bg-muted/30 border-transparent',
        className,
      )}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15 group-hover:shadow-card">
            {title ? (
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-transparent text-primary font-bold text-base">
                  {title.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <MessageSquare className="h-6 w-6 text-primary" />
            )}
          </div>
          {unreadCount != null && unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background">
              {unreadCount}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className={cn(
                'text-base font-bold truncate transition-colors',
                isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary/80',
              )}
            >
              {title}
            </span>
            {timestamp && (
              <span className="shrink-0 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {timestamp}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-body-sm text-muted-foreground leading-snug line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
