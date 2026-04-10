import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../../lib/cn';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';

export interface AuthTemplateProps {
  children: React.ReactNode;
  headline?: string;
  subtitle?: string;
  showLogo?: boolean;
  trustMessage?: string;
  testID?: string;
  topRightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  className?: string;
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
  footerSlot,
  contentStyle,
  className,
}: AuthTemplateProps) {
  const insets = useSafeAreaInsets();
  const [actionBarHeight, setActionBarHeight] = useState(210);

  const handleActionBarLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      setActionBarHeight(height);
    }
  };

  return (
    <ScreenContainer testID={testID} className={className}>
      {/*
       * topRightSlot is a sibling of KeyboardAvoidingView so it is never
       * shifted or clipped by keyboard-avoidance adjustments.
       * Positioning is explicit: we add the right safe-area inset on top of
       * the base 16 px margin to guard against landscape / notch devices.
       */}
      {topRightSlot ? (
        <View className="absolute z-20" style={{ top: 12, right: Math.max(insets.right + 16, 24) }}>
          {topRightSlot}
        </View>
      ) : null}
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <InsetScrollView
          contentContainerStyle={[
            { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          extraBottomInset={bottomSlot ? actionBarHeight : 0}
        >
          {/* Logo / Branding */}
          {showLogo && (
            <Text className="text-hero-title font-display-bold text-primaryDeep text-center mb-2xl">
              Tasky
            </Text>
          )}

          {/* Headline */}
          {headline && (
            <Text className="text-heading font-semibold text-primaryDeep text-center">
              {headline}
            </Text>
          )}

          {/* Subtitle */}
          {subtitle && (
            <Text className="text-body text-primary text-center mt-sm leading-relaxed">
              {subtitle}
            </Text>
          )}

          {/* Form Content */}
          <View className="mt-2xl gap-lg">{children}</View>

          {/* Trust Message */}
          {trustMessage && (
            <Text className="text-caption text-textTertiary text-center mt-2xl leading-relaxed">
              {trustMessage}
            </Text>
          )}

          {/* Footer links — inside scroll content so they scroll above the StickyActionBar */}
          {footerSlot ? (
            <View className="px-xl pb-lg items-center gap-md">{footerSlot}</View>
          ) : null}
        </InsetScrollView>
        {bottomSlot ? (
          <StickyActionBar>
            <View onLayout={handleActionBarLayout}>{bottomSlot}</View>
          </StickyActionBar>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
