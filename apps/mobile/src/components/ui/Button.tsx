import React from 'react';
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@tasky/design-tokens';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends TouchableOpacityProps {
    label?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    children?: React.ReactNode;
}

export const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
    (
        {
            label,
            variant = 'default',
            size = 'default',
            isLoading = false,
            disabled,
            style,
            textStyle,
            children,
            ...props
        },
        ref
    ) => {
        const isInteractive = !disabled && !isLoading;

        const buttonStyles: StyleProp<ViewStyle> = [
            styles.base,
            styles[`${variant}Variant` as keyof typeof styles],
            styles[`${size}Size` as keyof typeof styles],
            !isInteractive ? styles.disabled : undefined,
            style,
        ];

        const textColor = getTextColor(variant);

        return (
            <TouchableOpacity
                ref={ref}
                style={buttonStyles}
                disabled={!isInteractive}
                activeOpacity={0.8}
                {...props}
            >
                {isLoading ? (
                    <ActivityIndicator color={textColor}/>
                ) : children ? (
                    children
                ) : (
                    <Text
                        style={[
                            styles.text,
                            styles[`${size}Text` as keyof typeof styles],
                            {color: textColor},
                            textStyle,
                        ]}
                    >
                        {label}
                    </Text>
                )}
            </TouchableOpacity>
        );
    }
);

Button.displayName = 'Button';

function getTextColor(variant: ButtonVariant): string {
    switch (variant) {
        case 'secondary':
            return colors.secondary.foreground;
        case 'outline':
        case 'ghost':
            return colors.foreground;
        case 'destructive':
            return colors.destructive.foreground;
        case 'default':
        default:
            return colors.primary.foreground;
    }
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: parseInt(radius.DEFAULT),
    },
    disabled: {
        opacity: 0.5,
    },

    // Variants
    defaultVariant: {
        backgroundColor: colors.primary.DEFAULT,
    },
    secondaryVariant: {
        backgroundColor: colors.secondary.DEFAULT,
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
        backgroundColor: colors.destructive.DEFAULT,
    },

    // Sizes
    defaultSize: {
        paddingHorizontal: parseInt(spacing[4]),
        paddingVertical: parseInt(spacing[2]),
        minHeight: 40,
    },
    smSize: {
        paddingHorizontal: parseInt(spacing[3]),
        minHeight: 36,
    },
    lgSize: {
        paddingHorizontal: parseInt(spacing[8]),
        minHeight: 44,
    },
    iconSize: {
        width: 36,
        height: 36,
        padding: 0,
    },

    // Text
    text: {
        fontFamily: typography.fontFamily.sans,
        fontWeight: '500',
        textAlign: 'center',
    },
    defaultText: {
        fontSize: parseInt(typography.fontSize.sm),
    },
    smText: {
        fontSize: parseInt(typography.fontSize.xs),
    },
    lgText: {
        fontSize: parseInt(typography.fontSize.sm),
    },
    iconText: {
        display: 'none',
    },
});
