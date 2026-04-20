import { cva } from 'class-variance-authority';
import React from 'react';
import {
  ActivityIndicator,
  type GestureResponderEvent,
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

const { colors } = mobileTheme;

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md active:opacity-85 active:scale-[0.98]',
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
        default: 'px-lg py-sm min-h-[48px]',
        sm: 'px-md min-h-[40px]',
        lg: 'px-xl min-h-[56px]',
        icon: 'w-[36px] h-[36px] p-0',
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
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

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

    const handlePressIn = (e: GestureResponderEvent) => {
      props.onPressIn?.(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      props.onPressOut?.(e);
    };

    return (
      <Pressable
        ref={ref}
        style={[variant === 'default' && elevations.card, style]}
        className={cn(buttonVariants({ variant, size }), !isInteractive && 'opacity-40', className)}
        disabled={!isInteractive}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        <View className="flex-row items-center justify-center">
          {isLoading ? (
            <ActivityIndicator color={textColor} />
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
