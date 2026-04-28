import { cva } from 'class-variance-authority';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors, iconSizes } = mobileTheme;

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md active:opacity-pressed active:scale-pressed disabled:opacity-disabled',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-sun-light',
        outline: 'bg-transparent border-[1.5px] border-border',
        ghost: 'bg-transparent',
        destructive: 'bg-danger',
      },
      size: {
        default: 'px-lg py-sm min-h-touch-lg',
        sm: 'px-md min-h-3xl',
        lg: 'px-xl min-h-touch-xl',
        icon: 'size-touch p-0',
        'icon-sm': 'size-touch-sm p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

const textVariants = cva('text-center font-sans-bold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-card',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-danger-foreground',
    },
    size: {
      default: 'text-body',
      sm: 'text-label',
      lg: 'text-body',
      icon: 'hidden',
      'icon-sm': 'hidden',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  labelClassName?: string;
  children?: React.ReactNode;
}

function getTextColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'secondary':
      return colors.card;
    case 'outline':
    case 'ghost':
      return colors.foreground;
    case 'destructive':
      return colors.dangerForeground;
    case 'default':
    default:
      return colors.primaryForeground;
  }
}

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      label,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled,
      style,
      className,
      labelClassName,
      children,
      ...props
    },
    ref,
  ) => {
    const isInteractive = !disabled && !isLoading;
    const textColor = getTextColor(variant);

    return (
      <Pressable
        ref={ref}
        style={[variant === 'default' && elevations.card, style]}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={!isInteractive}
        {...props}
      >
        <View className="flex-row items-center justify-center">
          {isLoading ? (
            <ActivityIndicator color={textColor} size={iconSizes.semantic.status} />
          ) : children ? (
            children
          ) : (
            <Text className={cn(textVariants({ variant, size }), labelClassName)}>{label}</Text>
          )}
        </View>
      </Pressable>
    );
  },
);

Button.displayName = 'Button';
