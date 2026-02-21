import { StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "../../design/tokenAdapter";

type Variant = "info" | "success" | "error";

type Props = {
    message: string;
    variant?: Variant;
};

export function Toast({message, variant = "info"}: Props) {
    return (
        <View style={[styles.base, variantStyles[variant]]} accessibilityRole="alert">
            <Text style={[styles.text, variantTextStyles[variant]]}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: mobileTheme.radius.md,
        borderWidth: 1,
        paddingHorizontal: mobileTheme.spacing.md,
        paddingVertical: mobileTheme.spacing.sm
    },
    text: {
        fontSize: mobileTheme.typography.caption,
        fontWeight: "600"
    }
});

const variantStyles = StyleSheet.create({
    info: {
        backgroundColor: mobileTheme.colors.secondary,
        borderColor: mobileTheme.colors.border
    },
    success: {
        backgroundColor: mobileTheme.colors.muted,
        borderColor: mobileTheme.colors.primary
    },
    error: {
        backgroundColor: mobileTheme.colors.danger,
        borderColor: mobileTheme.colors.danger
    }
});

const variantTextStyles = StyleSheet.create({
    info: {
        color: mobileTheme.colors.secondaryForeground
    },
    success: {
        color: mobileTheme.colors.foreground
    },
    error: {
        color: mobileTheme.colors.dangerForeground
    }
});
