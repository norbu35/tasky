import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  Pressable,
  PressableProps,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';

const { colors, radius, spacing, typography } = mobileTheme;

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  className?: string;
  labelClassName?: string;
  children?: React.ReactNode;
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
      textStyle,
      className,
      labelClassName,
      children,
      ...props
    },
    ref,
  ) => {
    const isInteractive = !disabled && !isLoading;

    const buttonStyles: StyleProp<ViewStyle> = [
      styles.base,
      styles[`${variant}Variant` as keyof typeof styles] as ViewStyle,
      styles[`${size}Size` as keyof typeof styles] as ViewStyle,
      !isInteractive ? styles.disabled : undefined,
      style,
    ];

    const textColor = getTextColor(variant);

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const handlePressIn = (e: any) => {
      scale.value = withSpring(0.96, {
        damping: 15,
        stiffness: 300,
      });
      props.onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      props.onPressOut?.(e);
    };

    return (
      <Pressable
        ref={ref}
        style={buttonStyles}
        disabled={!isInteractive}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={className}
        {...props}
      >
        <Animated.View style={[styles.buttonInner, animatedStyle]}>
          {isLoading ? (
            <ActivityIndicator color={textColor} />
          ) : children ? (
            children
          ) : (
            <Text
              style={[
                styles.text,
                styles[`${size}Text` as keyof typeof styles],
                { color: textColor },
                textStyle,
              ]}
              className={labelClassName}
            >
              {label}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

function getTextColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'secondary':
      return colors.secondaryForeground;
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

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  defaultVariant: {
    backgroundColor: colors.primary,
    ...elevations.card,
  },
  secondaryVariant: {
    backgroundColor: colors.secondary,
  },
  outlineVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.input,
  },
  ghostVariant: {
    backgroundColor: 'transparent',
  },
  destructiveVariant: {
    backgroundColor: colors.danger,
  },

  // Sizes
  defaultSize: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  smSize: {
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  lgSize: {
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  iconSize: {
    width: 36,
    height: 36,
    padding: 0,
  },

  // Text
  text: {
    fontWeight: '700',
    textAlign: 'center',
  } as TextStyle,
  defaultText: {
    fontSize: typography.label,
  },
  smText: {
    fontSize: typography.caption,
  },
  lgText: {
    fontSize: typography.body,
  },
  iconText: {
    display: 'none',
  },
});
