import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { mobileTheme } from '../design/tokenAdapter';
import { Button } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Search, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
const { colors } = mobileTheme;

const SLIDES = [
  {
    id: '1',
    titleKey: 'onboarding.slide1_title',
    descKey: 'onboarding.slide1_desc',
    icon: Search,
  },
  {
    id: '2',
    titleKey: 'onboarding.slide2_title',
    descKey: 'onboarding.slide2_desc',
    icon: CheckCircle,
  },
  {
    id: '3',
    titleKey: 'onboarding.slide3_title',
    descKey: 'onboarding.slide3_desc',
    icon: ShieldCheck,
  }
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
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
      router.replace('/');
    }
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
    const Icon = item.icon;
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Icon size={120} color={colors.primary} strokeWidth={1} />
        </View>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.description}>{t(item.descKey)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
              style={[
                styles.dot,
                {
                  backgroundColor: currentIndex === index ? colors.primary : colors.border,
                  width: currentIndex === index ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>
        <Button
          label={currentIndex === SLIDES.length - 1 ? t("common.getStarted") : t("common.next")}
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
  slide: {
    width,
    alignItems: 'center',
    padding: 40,
    paddingTop: height * 0.15,
  },
  iconContainer: {
    marginBottom: 60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
    height: 56,
  }
});
