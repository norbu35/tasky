import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Facebook, Zap } from 'lucide-react-native';
import { useDevLogin } from '../../features/auth/hooks/useAuth';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button } from '../../components/ui/Button';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

type LoginState = 'default' | 'facebook_loading' | 'error';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [state, setState] = useState<LoginState>('default');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const devLogin = useDevLogin();
  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;

  const devAuthEnabled = runtimeEnv?.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true';
  const isFacebookLoading = state === 'facebook_loading';
  const busy = devLogin.isPending;

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

  const toggleLanguage = () => {
    void i18n.changeLanguage(i18n.language === 'mn' ? 'en' : 'mn');
  };

  return (
    <AuthTemplate
      testID="SCR-SHARED-002"
      showLogo
      headline={t('auth.login.title', 'Tasky-д тавтай морил')}
      subtitle={t(
        'auth.login.description',
        'Найдвартай гүйцэтгэгчтэй холбогдож, ажлаа хялбар захиалаарай',
      )}
      topRightSlot={
        <Pressable
          testID="language-switcher"
          onPress={toggleLanguage}
          style={styles.languagePill}
          accessibilityRole="button"
          accessibilityLabel={t('auth.login.languageSwitcher', 'MN/EN')}
        >
          <Text style={styles.languagePillText}>MN/EN</Text>
        </Pressable>
      }
      bottomSlot={
        <View style={styles.actions}>
          <Button
            testID="facebook-login-button"
            onPress={() => {
              void handleFacebookLogin();
            }}
            disabled={isFacebookLoading}
            isLoading={isFacebookLoading}
            style={styles.facebookButton}
          >
            {!isFacebookLoading ? (
              <View style={styles.facebookContent}>
                <Facebook size={20} color={colors.primaryForeground} />
                <Text style={styles.facebookText}>
                  {t('auth.login.facebookButton', 'Facebook-ээр нэвтрэх')}
                </Text>
              </View>
            ) : undefined}
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
                testID="dev-login-customer"
                label={t('auth.loginAsCustomer', 'Login as Customer')}
                variant="secondary"
                onPress={() => handleDevLoginAs('CUSTOMER')}
                disabled={busy}
              />
              <Button
                testID="dev-login-tasker"
                label={t('auth.loginAsTasker', 'Login as Tasker')}
                variant="secondary"
                onPress={() => handleDevLoginAs('TASKER')}
                disabled={busy}
              />
              {devLogin.error ? (
                <Text style={styles.errorText}>{devLogin.error.message}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      }
      footerSlot={
        <View style={styles.footerLinks}>
          <Pressable
            testID="login-footer-terms"
            onPress={() => router.push('/(shared)/legal/terms')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}>{t('auth.login.terms', 'Үйлчилгээний нөхцөл')}</Text>
          </Pressable>
          <Pressable
            testID="login-footer-privacy"
            onPress={() => router.push('/(shared)/legal/privacy')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}>{t('auth.login.privacy', 'Нууцлалын бодлого')}</Text>
          </Pressable>
          <Text style={styles.copyright}>
            {t('auth.login.copyright', '© 2024 Tasky. Бүх эрх хуулиар хамгаалагдсан.')}
          </Text>
        </View>
      }
    >
      {/* Brand icon — replaces Figma asset */}
      <View style={styles.brandIconWrap}>
        <View style={styles.brandIconCard}>
          <Zap size={32} color={colors.primaryForeground} />
        </View>
      </View>
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  languagePill: {
    borderWidth: 1,
    borderColor: 'rgba(195,198,207,0.2)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.background,
  },
  languagePillText: {
    color: colors.primaryDeep,
    fontSize: typography.label,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  brandIconWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandIconCard: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevations.card,
  },
  actions: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  facebookButton: {
    minHeight: 56,
    backgroundColor: colors.primaryDeep,
  },
  facebookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  facebookText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.body,
    textAlign: 'center',
  },
  devSection: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  devLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerLinks: {
    alignItems: 'center',
    gap: spacing.md,
  },
  footerLink: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  copyright: {
    color: colors.textSecondary,
    fontSize: typography.body,
    opacity: 0.6,
    textAlign: 'center',
  },
});
