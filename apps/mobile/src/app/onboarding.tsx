import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { mobileTheme } from '../design/tokenAdapter';
import { Button } from '../components/ui';

const { width } = Dimensions.get('window');
const { colors, spacing, typography } = mobileTheme;

const ONBOARDING_IMAGES = [
  'https://www.figma.com/api/mcp/asset/04e70df9-10b5-41ff-a560-297e68b06e74',
  'https://www.figma.com/api/mcp/asset/04e70df9-10b5-41ff-a560-297e68b06e74',
  'https://www.figma.com/api/mcp/asset/04e70df9-10b5-41ff-a560-297e68b06e74',
];

const SLIDES = [
  {
    id: '1',
    titleKey: 'auth.onboarding.slide1Title',
    bodyKey: 'auth.onboarding.slide1Body',
    imageUri: ONBOARDING_IMAGES[0],
    titleFallback: 'Найдвартай гүйцэтгэгч олох',
    bodyFallback: 'Баталгаажсан, итгэлтэй гүйцэтгэгчидтэй холбогдоорой',
  },
  {
    id: '2',
    titleKey: 'auth.onboarding.slide2Title',
    bodyKey: 'auth.onboarding.slide2Body',
    imageUri: ONBOARDING_IMAGES[1],
    titleFallback: 'Захиалга хийх амархан',
    bodyFallback: 'Ажлаа нийтэлж, хэдхэн товшилтоор захиалга хийгээрэй',
  },
  {
    id: '3',
    titleKey: 'auth.onboarding.slide3Title',
    bodyKey: 'auth.onboarding.slide3Body',
    imageUri: ONBOARDING_IMAGES[2],
    titleFallback: 'Аюулгүй, итгэлтэй',
    bodyFallback: 'Үнэлгээ, баталгаажуулалтаар хамгаалагдсан нийгэмлэг',
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
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
          <View style={styles.illustrationCard}>
            <Image
              source={{ uri: item.imageUri }}
              style={styles.heroImage}
              resizeMode="cover"
              testID={item.id === '1' ? 'onboarding-slide-image' : undefined}
            />
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
    <SafeAreaView style={styles.container} testID="onboarding-screen">
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
          label={
            isLastSlide
              ? t('auth.onboarding.getStarted', 'Эхлэх')
              : t('auth.onboarding.next', 'Дараагийх')
          }
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: '#1b3a5c',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    color: colors.primaryForeground,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDeep,
    textAlign: 'center',
    lineHeight: 30,
  },
  description: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: spacing['3xl'],
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: 6,
  },
  dot: {
    height: 3,
    borderRadius: 999,
  },
  button: {
    width: '100%',
    minHeight: 56,
  },
  skipSpacer: {
    width: 56,
    height: 24,
  },
});
