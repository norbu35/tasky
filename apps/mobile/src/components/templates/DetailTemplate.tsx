import React, { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { ErrorStateTemplate } from './ErrorStateTemplate';
import { useTranslation } from 'react-i18next';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';
import { screenLayout } from '../../design/screenLayout';

const { colors } = mobileTheme;

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
  className?: string;
}

function DetailSkeleton() {
  return (
    <View className="flex-1 pt-header-top gap-block">
      {/* Large skeleton block — dynamic size, kept imperative */}
      <View className="bg-muted rounded-md" style={{ height: 200 }} />
      <View className="bg-muted rounded-md" style={{ height: 32, width: '70%' }} />
      <View className="bg-muted rounded-md" style={{ height: 24, width: '45%' }} />
      <View className="bg-muted rounded-md" style={{ height: 32, width: '70%' }} />
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
  className,
}: DetailTemplateProps) {
  const { t } = useTranslation();
  const [actionBarHeight, setActionBarHeight] = useState(100);
  const hasBottomBar = !!(ctaLabel && ctaOnPress);

  const effectiveActions = rightActions ?? (rightAction ? [rightAction] : null);

  const handleActionBarLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      setActionBarHeight(height);
    }
  };

  return (
    <ScreenContainer
      style={hideHeader ? { paddingTop: 0 } : undefined}
      testID={testID}
      edges={hideHeader ? ['left', 'right'] : ['top', 'left', 'right']}
      className={className}
    >
      {/* Right action icons — absolute overlay top-right */}
      {effectiveActions && !isLoading && !isError && (
        <View
          className="absolute right-screen-x flex-row gap-micro z-10"
          style={{ top: screenLayout.header.topInset }}
          pointerEvents="box-none"
        >
          {effectiveActions.map((action, i) => (
            <Pressable
              key={i}
              onPress={action.onPress}
              className="w-11 h-11 items-center justify-center"
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
          message={errorMessage ?? t('detail.errorMessage')}
          onRetry={onRetry}
          testID={testID ? `${testID}-error` : undefined}
        />
      ) : isLoading ? (
        <DetailSkeleton />
      ) : (
        <InsetScrollView
          className="flex-1"
          contentContainerStyle={[
            {
              paddingTop: screenLayout.header.topInset,
            },
            hasBottomBar && { paddingBottom: screenLayout.body.sectionGap },
          ]}
          extraBottomInset={hasBottomBar ? actionBarHeight : 0}
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
          <View onLayout={handleActionBarLayout}>
            {/* BlurView does not reliably accept className in NativeWind v4 — kept imperative */}
            <BlurView
              intensity={40}
              tint="light"
              style={{
                padding: screenLayout.actions.barPadding,
                borderRadius: mobileTheme.radius.lg,
                overflow: 'hidden',
              }}
            >
              {secondaryCtaLabel && secondaryCtaOnPress && (
                <Button
                  label={secondaryCtaLabel}
                  variant="outline"
                  onPress={secondaryCtaOnPress}
                  style={{ alignSelf: 'stretch', marginBottom: screenLayout.actions.buttonGap }}
                  testID={testID ? `${testID}-secondary-cta` : undefined}
                />
              )}
              <Button
                label={ctaLabel}
                onPress={ctaOnPress}
                isLoading={ctaLoading}
                disabled={ctaDisabled}
                style={{ alignSelf: 'stretch' }}
                testID={testID ? `${testID}-cta` : undefined}
              />
            </BlurView>
          </View>
        </StickyActionBar>
      )}
    </ScreenContainer>
  );
}
