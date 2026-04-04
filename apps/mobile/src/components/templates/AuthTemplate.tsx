import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';

const { colors, spacing, typography } = mobileTheme;

export interface AuthTemplateProps {
  children: React.ReactNode;
  headline?: string;
  subtitle?: string;
  showLogo?: boolean;
  trustMessage?: string;
  testID?: string;
  topRightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AuthTemplate({
  children,
  headline,
  subtitle,
  showLogo = false,
  trustMessage,
  testID,
  topRightSlot,
  bottomSlot,
  contentStyle,
}: AuthTemplateProps) {
  return (
    <ScreenContainer testID={testID}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {topRightSlot ? <View style={styles.topRight}>{topRightSlot}</View> : null}
        <InsetScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          extraBottomInset={bottomSlot ? spacing['3xl'] : 0}
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
        </InsetScrollView>
        {bottomSlot ? <StickyActionBar>{bottomSlot}</StickyActionBar> : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
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
  topRight: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    zIndex: 10,
  },
  logo: {
    fontSize: typography.heroTitle,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    fontFamily: 'Manrope_700Bold',
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
