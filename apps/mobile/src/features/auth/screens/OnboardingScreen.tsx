import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Sparkles, Users } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { Button } from '@/components/ui/Button';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

const { width } = Dimensions.get('window');
const { colors, spacing } = mobileTheme;
const { illustrationCard, pagination, skipSpacer } = mobileSurfaces.onboarding;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const slideRef = useRef(0);
  const slides = [
    {
      id: '1',
      titleKey: 'auth.onboarding.slide1Title',
      bodyKey: 'auth.onboarding.slide1Body',
      icon: Users,
      iconColor: colors.primary,
      titleFallback: t('OnboardingScreen.copy1'),
      bodyFallback: t('OnboardingScreen.copy2'),
    },
    {
      id: '2',
      titleKey: 'auth.onboarding.slide2Title',
      bodyKey: 'auth.onboarding.slide2Body',
      icon: Sparkles,
      iconColor: colors.secondary,
      titleFallback: t('OnboardingScreen.copy3'),
      bodyFallback: t('OnboardingScreen.copy4'),
    },
    {
      id: '3',
      titleKey: 'auth.onboarding.slide3Title',
      bodyKey: 'auth.onboarding.slide3Body',
      icon: Shield,
      iconColor: colors.verified,
      titleFallback: t('OnboardingScreen.copy5'),
      bodyFallback: t('OnboardingScreen.copy6'),
    },
  ];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    slideRef.current = index;
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (slideRef.current < slides.length - 1) {
      slideRef.current += 1;
      setCurrentIndex(slideRef.current);
      flatListRef.current?.scrollToIndex({
        index: slideRef.current,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    router.replace('/(auth)/role-select');
  };

  const isLastSlide = currentIndex === slides.length - 1;

  const renderItem = ({ item }: { item: (typeof slides)[0] }) => {
    const titleText = t(item.titleKey, item.titleFallback);
    const bodyText = t(item.bodyKey, item.bodyFallback);
    return (
      <View
        className="items-center px-xl justify-center"
        style={{ width, paddingTop: spacing['3xl'] }}
      >
        <View
          className="mb-2xl items-center justify-center"
          style={{
            width: illustrationCard.width,
            height: illustrationCard.height,
            borderRadius: illustrationCard.radius,
            backgroundColor: colors.muted,
            transform: [{ rotate: illustrationCard.rotation }],
          }}
        >
          <View
            style={[StyleSheet.absoluteFill, { borderRadius: illustrationCard.radius }]}
            className="bg-muted"
          />
          <View
            className="self-stretch h-full overflow-hidden items-center justify-center"
            style={{
              borderRadius: illustrationCard.radius,
              backgroundColor:
                item.id === '3'
                  ? mobileSurfaces.tint.verifiedSoft
                  : item.id === '2'
                    ? mobileSurfaces.tint.primarySubtle
                    : mobileSurfaces.tint.primaryStrong,
            }}
          >
            <item.icon size={illustrationCard.iconSize} color={item.iconColor} />
            {item.id === '1' ? (
              <View
                className="absolute bottom-6 left-6 rounded-xl px-lg py-sm"
                style={{ backgroundColor: colors.primaryDeep }}
              >
                <Text
                  className="text-caption font-sans-bold tracking-normal"
                  style={{ color: colors.primaryForeground }}
                >
                  {t('auth.onboarding.badge')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View className="items-center">
          <Text
            className="text-heading font-display-bold text-center"
            style={{ color: colors.primaryDeep }}
          >
            {titleText}
          </Text>
        </View>
        <Text className="text-body text-center text-muted-foreground">{bodyText}</Text>
      </View>
    );
  };

  return (
    <ScreenContainer testID="SCR-SHARED-005">
      <View
        className="absolute z-10 flex-row items-center justify-between"
        style={{ top: spacing.lg, left: spacing.lg, right: spacing.lg }}
      >
        <Touchable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('common.back')}>
          <ArrowLeft size={24} color={colors.primaryDeep} />
        </Touchable>
        {isLastSlide ? (
          <View style={skipSpacer} />
        ) : (
          <Touchable testID="onboarding-skip" onPress={handleSkip} hitSlop={12}>
            <Text className="text-label font-sans-bold" style={{ color: colors.primaryDeep }}>
              {t('auth.onboarding.skip')}
            </Text>
          </Touchable>
        )}
      </View>
      <FlatList
        style={{ flex: 1 }}
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      <View className="px-xl" style={{ paddingBottom: spacing['3xl'] }}>
        <View
          className="flex-row justify-center items-center mb-xl"
          style={{ gap: spacing.md / 2 }}
        >
          {slides.map((_, index) => (
            <View
              key={index}
              testID={`pagination-dot-${index}`}
              style={{
                height: pagination.height,
                borderRadius: 999,
                backgroundColor: currentIndex === index ? colors.primary : colors.border,
                width: currentIndex === index ? pagination.activeWidth : pagination.inactiveWidth,
              }}
            />
          ))}
        </View>
        <Button
          testID="onboarding-next"
          label={isLastSlide ? t('auth.onboarding.getStarted') : t('auth.onboarding.next')}
          onPress={handleNext}
          className="self-stretch"
        />
      </View>
    </ScreenContainer>
  );
}
