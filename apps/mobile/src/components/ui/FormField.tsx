import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

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
    <View style={[styles.container, style]} className={className}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hasError ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {errorText}
        </Text>
      ) : null}
      {!hasError && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: mobileTheme.spacing.sm,
  },
  label: {
    fontSize: mobileTheme.typography.body,
    fontWeight: '600',
    color: mobileTheme.colors.foreground,
  },
  helper: {
    fontSize: mobileTheme.typography.caption,
    color: mobileTheme.colors.mutedForeground,
  },
  error: {
    fontSize: mobileTheme.typography.caption,
    color: mobileTheme.colors.danger,
  },
});
