import React from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';

export interface TouchableProps extends PressableProps {
  className?: string;
}

/**
 * Thin Pressable wrapper for non-button tap targets (list items, card areas, swipe zones).
 * Screens should use <Touchable> instead of raw <Pressable> — enforced by lint rule
 * `no-raw-pressable-in-screens`.
 */
export function Touchable({ className, style, children, testID, ...props }: TouchableProps) {
  if (__DEV__ && process.env.NODE_ENV === 'test' && !testID) {
    console.warn('Touchable: testID is required for all interactive elements');
  }
  return (
    <Pressable className={cn(className)} style={style} testID={testID} {...props}>
      {children}
    </Pressable>
  );
}
