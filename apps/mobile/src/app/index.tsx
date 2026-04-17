import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { CircleCheckBig } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { mobileSurfaces, mobileTheme } from '../design/tokenAdapter';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { resolvePostAuthHref } from '../utils/authRouting';

const { colors, spacing, typography } = mobileTheme;
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
        <View
          style={{
            width: splash.markBox,
            height: splash.markBox,
            borderRadius: splash.markRadius,
            borderWidth: 1,
            borderColor: splash.markBorder,
            backgroundColor: splash.markSurface,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <CircleCheckBig size={splash.markIcon} color={colors.primaryForeground} />
        </View>
        <Text
          style={{
            fontSize: splash.brandSize,
            fontWeight: '700',
            color: colors.primaryForeground,
            fontFamily: 'Manrope_700Bold',
            marginBottom: spacing.sm,
            letterSpacing: -1.8,
          }}
        >
          Tasky
        </Text>
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: typography.label,
              color: colors.primaryForeground,
              textAlign: 'center',
              letterSpacing: 2.1,
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
            letterSpacing: 1.2,
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
