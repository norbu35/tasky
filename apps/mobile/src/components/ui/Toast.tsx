import { Text, View } from 'react-native';

import { cn } from '../../lib/cn';

type Variant = 'info' | 'success' | 'error';

type Props = {
  message: string;
  variant?: Variant;
  className?: string;
};

const variantContainerClass: Record<Variant, string> = {
  info: 'bg-secondary border-border',
  success: 'bg-muted border-primary',
  error: 'bg-danger border-danger',
};

const variantTextClass: Record<Variant, string> = {
  info: 'text-secondary-foreground',
  success: 'text-foreground',
  error: 'text-danger-foreground',
};

export function Toast({ message, variant = 'info', className }: Props) {
  return (
    <View
      className={cn('rounded-md border px-md py-sm', variantContainerClass[variant], className)}
      accessibilityRole="alert"
    >
      <Text className={cn('text-caption font-sans-semibold', variantTextClass[variant])}>
        {message}
      </Text>
    </View>
  );
}
