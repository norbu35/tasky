import { MessageSquare } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
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
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-deep',
        isSelected && 'ring-1 ring-inset ring-primary/40 bg-muted/30',
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
      <CardContent className="flex items-start gap-3 p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
          {title ? (
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                {title.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <MessageSquare className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{title}</span>
            {timestamp && (
              <span className="shrink-0 text-xs text-muted-foreground">{timestamp}</span>
            )}
          </div>
          {subtitle && (
            <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {unreadCount != null && unreadCount > 0 && (
          <Badge className="shrink-0 shadow-card">{unreadCount}</Badge>
        )}
      </CardContent>
    </Card>
  );
}
