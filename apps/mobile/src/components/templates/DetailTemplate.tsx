import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../ui/Button';
import { ErrorStateTemplate } from './ErrorStateTemplate';
import { useTranslation } from 'react-i18next';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';
import { screenLayout } from '../../design/screenLayout';

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
  /** @deprecated Use rightActions instead. */
  rightAction?: { icon: React.ReactNode; onPress: () => void };
  /** Multiple header action icons (e.g., edit + settings). Renders as a horizontal row. */
  rightActions?: Array<{ icon: React.ReactNode; onPress: () => void; testID?: string }>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  testID?: string;
  hideHeader?: boolean;
  /** When true, the sticky CTA bar adds tab bar clearance automatically. */
  insideTabNavigator?: boolean;
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
  rightAction,
  rightActions,
  isLoading = false,
  isError = false,
  onRetry,
  errorMessage,
  testID,
  hideHeader = false,
  insideTabNavigator = false,
}: DetailTemplateProps) {
  const { t } = useTranslation();
  const hasBottomBar = !!(ctaLabel && ctaOnPress);

  const effectiveActions = rightActions ?? (rightAction ? [rightAction] : null);

  return (
    <ScreenContainer
      style={hideHeader ? styles.safeAreaNoTop : undefined}
      testID={testID}
      edges={hideHeader ? ['left', 'right'] : ['top', 'left', 'right']}
    >
      {/* Right action icons — absolute overlay top-right */}
      {effectiveActions && !isLoading && !isError && (
        <View style={styles.rightActionsRow} pointerEvents="box-none">
          {effectiveActions.map((action, i) => (
            <Pressable
              key={i}
              onPress={action.onPress}
              style={styles.rightActionButton}
              testID={(action as { testID?: string }).testID}
              hitSlop={8}
            >
              {action.icon}
            </Pressable>
          ))}
        </View>
      )}

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
        <InsetScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            hasBottomBar && styles.scrollContentWithActionBar,
          ]}
          extraBottomInset={hasBottomBar ? screenLayout.chrome.tabBarHeight : 0}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </InsetScrollView>
      )}

      {/* Sticky Bottom CTA */}
      {hasBottomBar && !isLoading && !isError && (
        <StickyActionBar
          testID={testID ? `${testID}-bottom-bar` : undefined}
          insideTabNavigator={insideTabNavigator}
        >
          <BlurView intensity={40} tint="light" style={styles.bottomBar}>
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
        </StickyActionBar>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeAreaNoTop: {
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: screenLayout.header.topInset,
    paddingHorizontal: screenLayout.insetX,
  },
  scrollContentWithActionBar: {
    paddingBottom: screenLayout.body.sectionGap,
  },
  bottomBar: {
    padding: screenLayout.actions.barPadding,
    borderRadius: mobileTheme.radius.lg,
    overflow: 'hidden',
  },
  primaryCta: {
    alignSelf: 'stretch',
  },
  secondaryCta: {
    alignSelf: 'stretch',
    marginBottom: screenLayout.actions.buttonGap,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: screenLayout.insetX,
    paddingTop: screenLayout.header.topInset,
    gap: screenLayout.body.blockGap,
  },
  rightActionsRow: {
    position: 'absolute',
    top: screenLayout.header.topInset,
    right: screenLayout.insetX,
    flexDirection: 'row',
    gap: screenLayout.body.microGap,
    zIndex: 10,
  },
  rightActionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
