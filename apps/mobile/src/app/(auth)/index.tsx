import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CircleCheckBig, Facebook } from 'lucide-react-native';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button } from '../../components/ui';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { useDevLogin } from '../../features/auth/hooks/useAuth';

const { colors, spacing, typography } = mobileTheme;

type LoginState = 'default' | 'facebook_loading' | 'error';

export default function LoginScreen() {
  const devAuthEnabled = process.env.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true';
  const { t } = useTranslation();
  const router = useRouter();
  const [state, setState] = useState<LoginState>('default');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const devLogin = useDevLogin();

  const handleFacebookLogin = async () => {
    setState('facebook_loading');
    try {
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Facebook SDK not configured')), 100),
      );
    } catch {
      setState('error');
      setErrorMessage(t('auth.login.error', 'Login failed. Please try again.'));
    }
  };

  const handleDevLoginAs = (role: 'CUSTOMER' | 'TASKER') => {
    const phone = role === 'CUSTOMER' ? '+97699999999' : '+97699988888';
    devLogin.mutate({ phone, role });
  };

  const busy = devLogin.isPending;

  return (
    <AuthTemplate
      testID="login-screen"
      bottomSlot={
        <View style={styles.languagePill}>
          <Text style={styles.languagePillText}>MN/EN</Text>
        </View>
      }
      contentStyle={styles.contentStyle}
    >
      <View style={styles.hero}>
        <View style={styles.brandMark}>
          <CircleCheckBig size={28} color={colors.primaryForeground} />
        </View>
        <Text style={styles.title}>{t('auth.login.title', 'Tasky-д тавтай морил')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.login.subtitleLine1', 'Найдвартай гүйцэтгэгчтэй холбогдож,')}
        </Text>
        <Text style={styles.subtitleSecondary}>
          {t('auth.login.subtitleLine2', 'ажлаа хялбар захиалаарай')}
        </Text>
      </View>

      <Button
        testID="facebook-login-button"
        onPress={handleFacebookLogin}
        isLoading={state === 'facebook_loading'}
        style={styles.facebookButton}
      >
        <View style={styles.buttonContent}>
          <Facebook size={18} color={colors.primaryForeground} />
          <Text style={styles.facebookButtonText}>
            {t('auth.login.facebookButton', 'Facebook-ээр нэвтрэх')}
          </Text>
        </View>
      </Button>

      {state === 'error' && errorMessage ? (
        <Text testID="login-error" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      {devAuthEnabled ? (
        <View style={styles.devSection}>
          <Text style={styles.devLabel}>{t('auth.devBypass', 'Dev bypass')}</Text>
          <Button
            label={t('auth.loginAsCustomer', 'Login as Customer')}
            variant="secondary"
            onPress={() => handleDevLoginAs('CUSTOMER')}
            isLoading={busy}
            style={styles.devButton}
          />
          <Button
            label={t('auth.loginAsTasker', 'Login as Tasker')}
            variant="secondary"
            onPress={() => handleDevLoginAs('TASKER')}
            isLoading={busy}
            style={styles.devButton}
          />
          {devLogin.error ? <Text style={styles.errorText}>{devLogin.error.message}</Text> : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Pressable onPress={() => router.push('/(shared)/legal/terms')}>
          <Text style={styles.footerLink}>{t('auth.login.terms', 'Үйлчилгээний нөхцөл')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(shared)/legal/privacy')}>
          <Text style={styles.footerLink}>{t('auth.login.privacy', 'Нууцлалын бодлого')}</Text>
        </Pressable>
      </View>
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  contentStyle: {
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  languagePill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: mobileTheme.radius.md,
    paddingHorizontal: 13,
    paddingVertical: 5,
    backgroundColor: colors.card,
  },
  languagePillText: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...elevations.elevated,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  subtitleSecondary: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  facebookButton: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  facebookButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '700',
  },
  errorText: {
    fontSize: typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  devSection: {
    marginTop: spacing['2xl'],
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  devLabel: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  devButton: {
    backgroundColor: colors.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing['2xl'],
  },
  footerLink: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
});
