import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export interface AuthTemplateProps {
  children: React.ReactNode;
  headline?: string;
  subtitle?: string;
  showLogo?: boolean;
  trustMessage?: string;
  testID?: string;
}

export function AuthTemplate({
  children,
  headline,
  subtitle,
  showLogo = false,
  trustMessage,
  testID,
}: AuthTemplateProps) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID={testID}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Branding */}
        {showLogo && <Text style={styles.logo}>Tasky</Text>}

        {/* Headline */}
        {headline && <Text style={styles.headline}>{headline}</Text>}

        {/* Subtitle */}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {/* Form Content */}
        <View style={styles.formContent}>{children}</View>

        {/* Trust Message */}
        {trustMessage && <Text style={styles.trustMessage}>{trustMessage}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  logo: {
    fontSize: typography.heroTitle,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    fontFamily: 'Manrope',
    marginBottom: spacing['2xl'],
  },
  headline: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.body * 1.6,
  },
  formContent: {
    marginTop: spacing['2xl'],
    gap: spacing.lg,
  },
  trustMessage: {
    fontSize: typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing['2xl'],
    lineHeight: typography.caption * 1.6,
  },
});
