import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { CircleCheckBig } from 'lucide-react-native';
import { mobileTheme } from '../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function SplashScreen() {
  const { t } = useTranslation();
  const session = useAuthStore((state) => state.session);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);

  // PRD §6.1 / JRN-SHARED-01: authenticate FIRST, then onboard new users.
  // No session → login. Session + first time → onboarding. Session + done → home.
  const nextHref = !session
    ? '/(auth)'
    : !hasSeenOnboarding
      ? '/onboarding'
      : session.user.primary_auth === 'FACEBOOK'
        ? '/(auth)/otp-migration'
        : session.user.role === 'CUSTOMER'
          ? '/(customer)/tasks'
          : '/(tabs)';

  return (
    <LinearGradient
      colors={[colors.primaryDeep, colors.primary, colors.primaryDeep]}
      style={styles.container}
      testID="SCR-SHARED-001"
    >
      <Redirect href={nextHref} />
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <CircleCheckBig size={28} color={colors.primaryForeground} />
        </View>
        <Text style={styles.logo}>Tasky</Text>
        <View style={styles.taglineWrap}>
          <Text style={styles.tagline}>
            {t('auth.splash.tagline', 'Найдвартай гүйцэтгэгч, хялбар захиалга')}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.poweredBy}>{t('auth.splash.poweredBy', 'Powered by secure tech')}</Text>
      </View>
      <ActivityIndicator
        testID="splash-loading"
        size="small"
        color={colors.secondary}
        style={styles.loader}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.primaryForeground,
    fontFamily: 'Manrope_700Bold',
    marginBottom: spacing.sm,
    letterSpacing: -1.8,
  },
  taglineWrap: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: typography.label,
    color: colors.primaryForeground,
    textAlign: 'center',
    letterSpacing: 2.1,
    textTransform: 'uppercase',
    lineHeight: 24,
  },
  loader: {
    position: 'absolute',
    bottom: 28,
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressTrack: {
    width: 136,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    width: 42,
    height: 2,
    backgroundColor: colors.secondary,
  },
  poweredBy: {
    fontSize: typography.micro,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
