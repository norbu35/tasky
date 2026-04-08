import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
  return (
    <ScreenContainer testID={testID} className={className}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {topRightSlot ? (
          <View className="absolute top-xl right-xl z-10">{topRightSlot}</View>
        ) : null}
        <InsetScrollView
          contentContainerStyle={[
            { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          extraBottomInset={bottomSlot ? 210 : 0}
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
        {bottomSlot ? <StickyActionBar>{bottomSlot}</StickyActionBar> : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
