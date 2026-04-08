import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { Touchable } from '../../../components/ui/Touchable';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../../../components/shells';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function ConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const dataItems = [
    t(
      'tasker.verification.consentIdPhotos',
      'Иргэний үнэмлэхний зураг (урд, ар тал)',
    ),
    t('tasker.verification.uploadSelfie', 'Амьд зураг (selfie)'),
    t('tasker.verification.consentPurpose', 'Таниулах баталгаажуулалт'),
    t(
      'tasker.verification.consentRetention',
      'Бүртгэл хүчинтэй байх хугацаанд хадгалагдана',
    ),
    t(
      'tasker.verification.consentDeletion',
      'Бүртгэл устгахад мэдээлэл устгагдана',
    ),
  ];

  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const reachedBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - spacing.lg;
    if (reachedBottom) {
      setHasScrolledToEnd(true);
    }
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
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        testID="consent-scroll"
        extraBottomInset={96}
      >
        <Text
          className="text-heading font-display-bold text-primaryDeep"
          style={{ lineHeight: typography.heading * 1.2 }}
        >
          {t('tasker.verification.consentTitle')}
        </Text>
        <Text
          className="text-body text-textSecondary"
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
