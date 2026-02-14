import type {ReactNode} from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {mobileTheme} from "../../design/tokenAdapter";

type ButtonVariant = "primary" | "secondary" | "ghost";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text
          style={[
            styles.textBase,
            variantTextStyles[variant],
            isDisabled && styles.textDisabled
          ]}
        >
          {loading ? "Loading..." : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 140,
    borderRadius: mobileTheme.radius.md,
    paddingHorizontal: mobileTheme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  content: {
    flexDirection: "row",
    gap: mobileTheme.spacing.sm,
    alignItems: "center"
  },
  textBase: {
    fontSize: mobileTheme.typography.body,
    fontWeight: "600"
  },
  pressed: {
    opacity: 0.86
  },
  disabled: {
    opacity: 0.55
  },
  textDisabled: {
    color: mobileTheme.colors.mutedForeground
  }
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary
  },
  secondary: {
    backgroundColor: mobileTheme.colors.secondary,
    borderColor: mobileTheme.colors.border
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  }
});

const variantTextStyles = StyleSheet.create({
  primary: {
    color: mobileTheme.colors.primaryForeground
  },
  secondary: {
    color: mobileTheme.colors.secondaryForeground
  },
  ghost: {
    color: mobileTheme.colors.foreground
  }
});
