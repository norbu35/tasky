import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';

type Props = {
  label: string;
  helperText?: string;
  errorText?: string;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function FormField({ label, helperText, errorText, children, className, style }: Props) {
  const hasError = Boolean(errorText);
  return (
    <View style={style} className={cn('gap-xs', className)}>
      <Text className="text-label font-sans-semibold text-foreground">{label}</Text>
      {children}
      {hasError ? (
        <Text className="text-caption font-sans text-danger">{errorText}</Text>
      ) : helperText ? (
        <Text className="text-caption font-sans text-muted-foreground">{helperText}</Text>
      ) : null}
    </View>
  );
}
