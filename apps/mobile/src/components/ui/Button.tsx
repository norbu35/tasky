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
import { mobileTheme } from '../../design/tokenAdapter';

const {colors, radius, spacing, typography} = mobileTheme;

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
            styles[`${variant}Variant` as keyof typeof styles] as ViewStyle,
            styles[`${size}Size` as keyof typeof styles] as ViewStyle,
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
        borderRadius: 8,
    },
    disabled: {
        opacity: 0.5,
    },

    // Variants
    defaultVariant: {
        backgroundColor: colors.primary,
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 40,
    },
    smSize: {
        paddingHorizontal: 12,
        minHeight: 36,
    },
    lgSize: {
        paddingHorizontal: 32,
        minHeight: 44,
    },
    iconSize: {
        width: 36,
        height: 36,
        padding: 0,
    },

    // Text
    text: {
        fontWeight: '500',
        textAlign: 'center',
    } as TextStyle,
    defaultText: {
        fontSize: 14,
    },
    smText: {
        fontSize: 12,
    },
    lgText: {
        fontSize: 14,
    },
    iconText: {
        display: 'none',
    },
});
