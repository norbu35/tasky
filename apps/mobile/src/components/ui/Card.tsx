import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';

import { elevations } from '@/design/elevations';
import { cn } from '@/lib/cn';

type CardViewProps = ViewProps & { className?: string };
type CardTextProps = TextProps & { className?: string };

export function Card({ style, className, ...props }: CardViewProps) {
  return (
    <View
      style={[elevations.card, style]}
      className={cn('bg-card rounded-md overflow-hidden', className)}
      {...props}
    />
  );
}

export function CardHeader({ style, className, ...props }: CardViewProps) {
  return <View style={style} className={cn('p-lg pb-sm', className)} {...props} />;
}

export function CardTitle({ style, className, ...props }: CardTextProps) {
  return (
    <Text
      style={style}
      className={cn('text-title font-sans-bold text-card-foreground tracking-tight', className)}
      {...props}
    />
  );
}

export function CardDescription({ style, className, ...props }: CardTextProps) {
  return (
    <Text
      style={style}
      className={cn('text-body font-sans text-muted-foreground mt-xs', className)}
      {...props}
    />
  );
}

export function CardContent({ style, className, ...props }: CardViewProps) {
  return <View style={style} className={cn('p-lg pt-sm', className)} {...props} />;
}

export function CardFooter({ style, className, ...props }: CardViewProps) {
  return (
    <View style={style} className={cn('p-lg pt-0 flex-row items-center', className)} {...props} />
  );
}
