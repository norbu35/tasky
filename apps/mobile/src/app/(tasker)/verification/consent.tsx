import { useRouter } from 'expo-router';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer, StickyActionBar } from '../../../components/shells';
import { Button } from '../../../components/ui/Button';
import { Touchable } from '../../../components/ui/Touchable';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function ConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const dataItems = [
    t('ConsentScreen.copy1'),
    t('tasker.verification.uploadSelfie'),
    t('tasker.verification.consentPurpose'),
    t('ConsentScreen.copy2'),
    t('ConsentScreen.copy3'),
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const reachedBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - spacing.lg;
    if (reachedBottom) {
      setHasScrolledToEnd(true);
    }
  };

  const viewportRef = React.useRef(0);
  const contentRef = React.useRef(0);

  const checkIfContentFits = () => {
    if (
      viewportRef.current > 0 &&
      contentRef.current > 0 &&
      viewportRef.current >= contentRef.current - spacing.lg
    ) {
      setHasScrolledToEnd(true);
    }
  };

  const handleContentSizeChange = (_w: number, contentHeight: number) => {
    contentRef.current = contentHeight;
    checkIfContentFits();
  };
  const handleLayout = (event: NativeSyntheticEvent<{ layout: { height: number } }>) => {
    viewportRef.current = event.nativeEvent.layout.height;
    checkIfContentFits();
  };

  return (
    <ScreenContainer testID="SCR-TASK-004">
      <View className="min-h-[56px] flex-row items-center justify-between px-md">
        <Touchable
          onPress={() => router.back()}
          className="w-[40px] h-[40px] justify-center items-center"
          hitSlop={spacing.sm}
          testID="consent-screen-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Touchable>
        <Text className="flex-1 text-subtitle font-sans-semibold text-primary text-center mx-sm">
          {t('tasker.verification.consentTitle')}
        </Text>
        <View className="w-[40px] h-[40px]" />
      </View>

      <InsetScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        testID="consent-scroll"
        extraBottomInset={96}
      >
        <Text
          className="text-heading font-display-bold text-primary-deep"
          style={{ lineHeight: typography.heading * 1.2 }}
        >
          {t('tasker.verification.consentTitle')}
        </Text>
        <Text
          className="text-body text-text-secondary"
          style={{ lineHeight: typography.body * 1.6 }}
        >
          {t('tasker.verification.consentBody')}
        </Text>

        <View className="gap-sm p-lg rounded-md bg-muted" testID="consent-data-items">
          {dataItems.map((item) => (
            <Text
              key={item}
              className="text-body text-primary"
              style={{ lineHeight: typography.body * 1.6 }}
            >
              {item}
            </Text>
          ))}
        </View>

        <Touchable
          className="flex-row items-center gap-sm self-start"
          onPress={() => router.push('/(shared)/legal/privacy')}
          testID="consent-privacy-link"
        >
          <Text className="text-body text-accent font-sans-medium">
            {t('tasker.verification.consentPrivacy')}
          </Text>
          <ExternalLink size={18} color={colors.accent} />
        </Touchable>
      </InsetScrollView>

      <StickyActionBar>
        <View className="py-md px-md">
          <Button
            label={t('tasker.verification.consentContinue')}
            onPress={() => router.push('/(tasker)/verification/upload')}
            disabled={!hasScrolledToEnd}
            className="self-stretch"
            testID="consent-screen-cta"
          />
        </View>
      </StickyActionBar>
    </ScreenContainer>
  );
}
