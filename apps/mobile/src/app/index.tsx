import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { mobileTheme } from '../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function SplashScreen() {
  const { t } = useTranslation();
  const session = useAuthStore((state) => state.session);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  const nextHref = hasSeenOnboarding ? '/(auth)' : '/onboarding';

  return (
    <LinearGradient colors={['#0C2B47', '#173B5B', '#0C2B47']} style={styles.container} testID="splash-screen">
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <Text style={styles.brandGlyph}>✓</Text>
        </View>
        <Text style={styles.logo}>Tasky</Text>
        <View style={styles.taglineWrap}>
          <Text style={styles.tagline}>{t('auth.splash.taglineLine1', 'Найдвартай гүйцэтгэгч')}</Text>
          <Text style={styles.taglineSecondary}>
            {t('auth.splash.taglineLine2', 'хялбар захиалга')}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.poweredBy}>
          {t('auth.splash.poweredBy', 'Powered by secure tech')}
        </Text>
      </View>
      <ActivityIndicator
        testID="splash-loading"
        size="small"
        color={colors.secondary}
        style={styles.loader}
      />
      <Redirect href={nextHref} />
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
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  brandGlyph: {
    color: colors.primaryForeground,
    fontSize: 28,
    fontWeight: '700',
  },
  logo: {
    fontSize: 60,
    fontWeight: '700',
    color: colors.primaryForeground,
    fontFamily: 'Manrope',
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
  taglineSecondary: {
    fontSize: typography.label,
    color: 'rgba(255,255,255,0.8)',
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
