import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../ui/Button';
import { ErrorStateTemplate } from './ErrorStateTemplate';
import { useTranslation } from 'react-i18next';

const { colors, spacing } = mobileTheme;

export interface DetailTemplateProps {
  children: React.ReactNode;
  /** @deprecated Title is now set via Stack.Screen options in the layout. */
  headerTitle?: string;
  /** @deprecated Back navigation is now handled by the native Stack header. */
  onBack?: () => void;
  ctaLabel?: string;
  ctaOnPress?: () => void;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaOnPress?: () => void;
  /** @deprecated Use Stack.Screen headerRight in your layout instead. */
  rightAction?: { icon: React.ReactNode; onPress: () => void };
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  testID?: string;
  /**
   * When true the template renders without top SafeArea padding,
   * useful for full-bleed hero screens where the native header is hidden.
   */
  hideHeader?: boolean;
}

function DetailSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonBlockLarge} />
      <View style={styles.skeletonBlockMedium} />
      <View style={styles.skeletonBlockSmall} />
      <View style={styles.skeletonBlockMedium} />
    </View>
  );
}

export function DetailTemplate({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  headerTitle: _headerTitle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBack: _onBack,
  ctaLabel,
  ctaOnPress,
  ctaLoading = false,
  ctaDisabled = false,
  secondaryCtaLabel,
  secondaryCtaOnPress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rightAction: _rightAction,
  isLoading = false,
  isError = false,
  onRetry,
  errorMessage,
  testID,
  hideHeader = false,
}: DetailTemplateProps) {
  const { t } = useTranslation();
  const hasBottomBar = !!(ctaLabel && ctaOnPress);

  return (
    <SafeAreaView style={[styles.safeArea, hideHeader && styles.safeAreaNoTop]} testID={testID}>
      {/* Body */}
      {isError ? (
        <ErrorStateTemplate
          message={errorMessage ?? t('detail.errorMessage', 'Could not load details')}
          onRetry={onRetry}
          testID={testID ? `${testID}-error` : undefined}
        />
      ) : isLoading ? (
        <DetailSkeleton />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            hasBottomBar && styles.scrollContentWithCta,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}

      {/* Sticky Bottom CTA */}
      {hasBottomBar && !isLoading && !isError && (
        <BlurView
          intensity={40}
          tint="light"
          style={styles.bottomBar}
          testID={testID ? `${testID}-bottom-bar` : undefined}
        >
          {secondaryCtaLabel && secondaryCtaOnPress && (
            <Button
              label={secondaryCtaLabel}
              variant="outline"
              onPress={secondaryCtaOnPress}
              style={styles.secondaryCta}
              testID={testID ? `${testID}-secondary-cta` : undefined}
            />
          )}
          <Button
            label={ctaLabel}
            onPress={ctaOnPress}
            isLoading={ctaLoading}
            disabled={ctaDisabled}
            style={styles.primaryCta}
            testID={testID ? `${testID}-cta` : undefined}
          />
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeAreaNoTop: {
    // Used when hideHeader=true — removes SafeArea top inset so
    // full-bleed hero content can extend behind the status bar.
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scrollContentWithCta: {
    paddingBottom: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  primaryCta: {
    alignSelf: 'stretch',
  },
  secondaryCta: {
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  skeletonBlockLarge: {
    height: 200,
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
  },
  skeletonBlockMedium: {
    height: spacing['3xl'],
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
    width: '70%',
  },
  skeletonBlockSmall: {
    height: spacing.xl,
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
    width: '45%',
  },
});
