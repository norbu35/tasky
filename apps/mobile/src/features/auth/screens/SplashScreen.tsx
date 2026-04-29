import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Image, Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { useSplashBootstrap } from '@/providers/SplashBootstrapProvider';
import taskyLogo from '@assets/logo.png';

const { colors, spacing, typography, typographyVariants } = mobileTheme;
const { splash } = mobileSurfaces;

function destinationToHref(dest: ReturnType<typeof useSplashBootstrap>['destination']): string {
  switch (dest) {
    case 'auth':
      return '/(auth)';
    case 'onboarding':
      return '/onboarding';
    case 'tabs':
      return '/(tabs)';
    default:
      return '/(auth)';
  }
}

export default function SplashScreen() {
  const { t } = useTranslation();
  const { phase, destination } = useSplashBootstrap();

  const [progress] = useState(() => new Animated.Value(0));

  const targetProgress = useMemo(() => {
    switch (phase) {
      case 'initializing':
      case 'restoring-session':
        return 0.15;
      case 'prefetching':
        return 0.6;
      case 'minimum-display':
        return 0.85;
      case 'ready':
        return 1;
      case 'error':
        return 0.5;
    }
  }, [phase]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: targetProgress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [targetProgress, progress]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, splash.progressRailWidth],
  });

  const statusText = useMemo(() => {
    switch (phase) {
      case 'prefetching':
        return t('SplashScreen.loadingData');
      case 'minimum-display':
      case 'ready':
        return t('SplashScreen.almostReady');
      default:
        return t('SplashScreen.startingUp');
    }
  }, [phase, t]);

  return (
    <LinearGradient
      colors={[colors.primaryDeep, colors.primary, colors.primaryDeep]}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      testID="SCR-SHARED-001"
    >
      {destination && phase === 'ready' && <Redirect href={destinationToHref(destination)} />}
      <View style={{ alignItems: 'center', paddingHorizontal: spacing['2xl'] }}>
        <Image
          source={taskyLogo}
          testID="tasky-logo"
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{
            width: 168,
            height: 168,
            borderRadius: 36,
            marginBottom: spacing['2xl'],
          }}
        />
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: typography.label,
              color: colors.primaryForeground,
              textAlign: 'center',
              letterSpacing: typographyVariants.badgeText.letterSpacing,
              textTransform: 'uppercase',
              lineHeight: mobileSurfaces.paragraphLineHeight,
            }}
          >
            {t('SplashScreen.tagline')}
          </Text>
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: splash.footerBottom,
          alignItems: 'center',
          gap: spacing.lg,
        }}
      >
        <Animated.View
          style={{
            width: splash.progressRailWidth,
            height: splash.progressRailHeight,
            backgroundColor: splash.progressSurface,
            overflow: 'hidden',
            borderRadius: splash.progressRailHeight,
          }}
        >
          <Animated.View
            style={{
              width: fillWidth,
              height: splash.progressRailHeight,
              backgroundColor: colors.secondary,
              borderRadius: splash.progressRailHeight,
            }}
          />
        </Animated.View>
        <Text
          style={{
            fontSize: typography.micro,
            color: splash.footerText,
            letterSpacing: typographyVariants.badgeText.letterSpacing,
            textTransform: 'uppercase',
          }}
        >
          {statusText}
        </Text>
      </View>
      {phase !== 'ready' && (
        <ActivityIndicator
          testID="splash-loading"
          size="small"
          color={colors.secondary}
          style={{ position: 'absolute', bottom: splash.loaderBottom }}
        />
      )}
    </LinearGradient>
  );
}
