import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { screenLayout } from '@/design/screenLayout';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';
import { Button } from '../ui/Button';

import { ErrorStateTemplate } from './ErrorStateTemplate';

const DETAIL_TEMPLATE_SURFACE = {
  skeletonHeroHeight: 200,
  skeletonTitleHeight: 32,
  skeletonBodyHeight: 24,
  rightActionSize: 44,
} as const;

export interface DetailTemplateProps {
  children: React.ReactNode;
  ctaLabel?: string;
  ctaOnPress?: () => void;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaOnPress?: () => void;
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
      <View
        className="bg-muted rounded-md"
        style={{ height: DETAIL_TEMPLATE_SURFACE.skeletonHeroHeight }}
      />
      <View
        className="bg-muted rounded-md"
        style={{ height: DETAIL_TEMPLATE_SURFACE.skeletonTitleHeight, width: '70%' }}
      />
      <View
        className="bg-muted rounded-md"
        style={{ height: DETAIL_TEMPLATE_SURFACE.skeletonBodyHeight, width: '45%' }}
      />
      <View
        className="bg-muted rounded-md"
        style={{ height: DETAIL_TEMPLATE_SURFACE.skeletonTitleHeight, width: '70%' }}
      />
    </View>
  );
}

export function DetailTemplate({
  children,
  ctaLabel,
  ctaOnPress,
  ctaLoading = false,
  ctaDisabled = false,
  secondaryCtaLabel,
  secondaryCtaOnPress,
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

  const effectiveActions = rightActions ?? null;

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
              className="items-center justify-center"
              style={{
                width: DETAIL_TEMPLATE_SURFACE.rightActionSize,
                height: DETAIL_TEMPLATE_SURFACE.rightActionSize,
              }}
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
          </View>
        </StickyActionBar>
      )}
    </ScreenContainer>
  );
}
