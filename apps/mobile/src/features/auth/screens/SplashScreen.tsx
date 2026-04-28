import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { resolvePostAuthHref } from '@/utils/authRouting';
import taskyLogo from '@assets/logo.png';

const { colors, spacing, typography, typographyVariants } = mobileTheme;
const { splash } = mobileSurfaces;

export default function SplashScreen() {
  const { t } = useTranslation();
  const session = useAuthStore((state) => state.session);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const nextHref = resolvePostAuthHref(session, hasSeenOnboarding);

  return (
    <LinearGradient
      colors={[colors.primaryDeep, colors.primary, colors.primaryDeep]}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      testID="SCR-SHARED-001"
    >
      <Redirect href={nextHref} />
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
        <View
          style={{
            width: splash.progressRailWidth,
            height: splash.progressRailHeight,
            backgroundColor: splash.progressSurface,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: splash.progressFillWidth,
              height: splash.progressRailHeight,
              backgroundColor: colors.secondary,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: typography.micro,
            color: splash.footerText,
            letterSpacing: typographyVariants.badgeText.letterSpacing,
            textTransform: 'uppercase',
          }}
        >
          {t('SplashScreen.poweredBy')}
        </Text>
      </View>
      <ActivityIndicator
        testID="splash-loading"
        size="small"
        color={colors.secondary}
        style={{ position: 'absolute', bottom: splash.loaderBottom }}
      />
    </LinearGradient>
  );
}
