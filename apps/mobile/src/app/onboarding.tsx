import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Search, ShieldCheck } from 'lucide-react-native';
import { useAppStore } from '../store/appStore';
import { mobileTheme } from '../design/tokenAdapter';
import { Button } from '../components/ui';

const { width } = Dimensions.get('window');
const { colors, spacing, typography } = mobileTheme;

const SLIDES = [
  {
    id: '1',
    titleKey: 'auth.onboarding.slide1Title',
    bodyKey: 'auth.onboarding.slide1Body',
    icon: Search,
  },
  {
    id: '2',
    titleKey: 'auth.onboarding.slide2Title',
    bodyKey: 'auth.onboarding.slide2Body',
    icon: CheckCircle,
  },
  {
    id: '3',
    titleKey: 'auth.onboarding.slide3Title',
    bodyKey: 'auth.onboarding.slide3Body',
    icon: ShieldCheck,
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
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
    completeOnboarding();
    router.replace('/(auth)/role-select');
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderItem = ({ item }: { item: (typeof SLIDES)[0] }) => {
    const Icon = item.icon;
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Icon size={120} color={colors.primary} strokeWidth={1} />
        </View>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.description}>{t(item.bodyKey)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="onboarding-screen">
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

      {!isLastSlide && (
        <View style={styles.skipContainer}>
          <Button
            testID="onboarding-skip"
            label={t('auth.onboarding.skip', 'Skip')}
            variant="ghost"
            onPress={handleSkip}
          />
        </View>
      )}

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
                  width: currentIndex === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        <Button
          testID="onboarding-next"
          label={
            isLastSlide
              ? t('auth.onboarding.getStarted', 'Get Started')
              : t('auth.onboarding.next', 'Next')
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
  skipContainer: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 10,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: spacing['2xl'],
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.subtleViolet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.md,
    textAlign: 'center',
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
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
    minHeight: 56,
  },
});
