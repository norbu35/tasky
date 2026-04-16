import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { CircleCheckBig } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { mobileTheme } from '../design/tokenAdapter';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { resolvePostAuthHref } from '../utils/authRouting';

const { colors, spacing, typography } = mobileTheme;

/** Brand splash logo size — intentionally larger than the token scale */
const SPLASH_BRAND_SIZE = 56;

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
            width: 64,
            height: 64,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <CircleCheckBig size={28} color={colors.primaryForeground} />
        </View>
        <Text
          style={{
            fontSize: SPLASH_BRAND_SIZE, // eslint-disable-line no-restricted-syntax -- branded splash, no token equivalent
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
              lineHeight: 24,
            }}
          >
            {t('SplashScreen.tagline')}
          </Text>
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 64,
          alignItems: 'center',
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            width: 136,
            height: 2,
            backgroundColor: 'rgba(255,255,255,0.16)',
            overflow: 'hidden',
          }}
        >
          <View style={{ width: 42, height: 2, backgroundColor: colors.secondary }} />
        </View>
        <Text
          style={{
            fontSize: typography.micro,
            color: 'rgba(255,255,255,0.72)',
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
        style={{ position: 'absolute', bottom: 28 }}
      />
    </LinearGradient>
  );
}
