import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield, Sparkles, Users } from 'lucide-react-native';
import { mobileTheme } from '../design/tokenAdapter';
import { ScreenContainer } from '../components/shells';
import { Button } from '../components/ui/Button';

const { width } = Dimensions.get('window');
const { colors, spacing, typography } = mobileTheme;

const SLIDES = [
  {
    id: '1',
    titleKey: 'auth.onboarding.slide1Title',
    bodyKey: 'auth.onboarding.slide1Body',
    icon: Users,
    iconColor: colors.primary,
    titleFallback: 'Найдвартай гүйцэтгэгч олох',
    bodyFallback: 'Баталгаажсан, итгэлтэй гүйцэтгэгчидтэй холбогдоорой',
  },
  {
    id: '2',
    titleKey: 'auth.onboarding.slide2Title',
    bodyKey: 'auth.onboarding.slide2Body',
    icon: Sparkles,
    iconColor: colors.secondary,
    titleFallback: 'Захиалга хийх амархан',
    bodyFallback: 'Ажлаа нийтэлж, хэдхэн товшилтоор захиалга хийгээрэй',
  },
  {
    id: '3',
    titleKey: 'auth.onboarding.slide3Title',
    bodyKey: 'auth.onboarding.slide3Body',
    icon: Shield,
    iconColor: colors.verified,
    titleFallback: 'Аюулгүй, итгэлтэй',
    bodyFallback: 'Үнэлгээ, баталгаажуулалтаар хамгаалагдсан нийгэмлэг',
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const slideRef = useRef(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    slideRef.current = index;
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (slideRef.current < SLIDES.length - 1) {
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

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderItem = ({ item }: { item: (typeof SLIDES)[0] }) => {
    const titleText = item.titleFallback ?? t(item.titleKey);
    const bodyText = item.bodyFallback ?? t(item.bodyKey);
    return (
      <View style={styles.slide}>
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationBackdrop} />
          <View style={[styles.illustrationCard, { backgroundColor: `${item.iconColor}15` }]}>
            <item.icon size={80} color={item.iconColor} />
            {item.id === '1' ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('auth.onboarding.badge', 'БАТАЛГААЖСАН')}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{titleText}</Text>
        </View>
        <Text style={styles.description}>{bodyText}</Text>
      </View>
    );
  };

  return (
    <ScreenContainer testID="SCR-SHARED-005">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
          <ArrowLeft size={24} color={colors.primaryDeep} />
        </Pressable>
        {isLastSlide ? (
          <View style={styles.skipSpacer} />
        ) : (
          <Pressable testID="onboarding-skip" onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipLabel}>{t('auth.onboarding.skip', 'Алгасах')}</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        style={{ flex: 1 }}
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              testID={`pagination-dot-${index}`}
              style={[
                styles.dot,
                {
                  backgroundColor: currentIndex === index ? colors.primary : colors.border,
                  width: currentIndex === index ? 10 : 6,
                },
              ]}
            />
          ))}
        </View>
        <Button
          testID="onboarding-next"
          label={isLastSlide
            ? t('auth.onboarding.getStarted', 'Эхлэх')
            : t('auth.onboarding.next', 'Дараагийх')}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipLabel: {
    color: colors.primaryDeep,
    fontSize: typography.label,
    fontWeight: '700',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    justifyContent: 'center',
  },
  illustrationWrap: {
    marginBottom: spacing['2xl'],
    width: 326,
    height: 407,
    borderRadius: 32,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  illustrationBackdrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    backgroundColor: colors.muted,
  },
  illustrationCard: {
    alignSelf: 'stretch',
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: colors.primaryDeep,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    color: colors.primaryForeground,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
    textAlign: 'center',
    lineHeight: typography.heading * 1.25,
  },
  description: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md / 2,
  },
  dot: {
    height: 3,
    borderRadius: 999,
  },
  nextButton: {
    alignSelf: 'stretch',
  },
  skipSpacer: {
    width: 56,
    height: 24,
  },
});
