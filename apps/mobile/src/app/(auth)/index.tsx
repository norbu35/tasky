import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDevLogin } from '../../features/auth/hooks/useAuth';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { InsetScrollView, ScreenContainer } from '../../components/shells';

const { colors, spacing, typography, radius } = mobileTheme;

const figmaBrandIconUri =
  'https://www.figma.com/api/mcp/asset/e6b0056f-a59c-4588-a0a0-58a19f241eea';
const figmaFacebookIconUri =
  'https://www.figma.com/api/mcp/asset/f8fb49cc-9362-4143-81f5-806311ac01ea';
const figmaHeroTextureUri =
  'https://www.figma.com/api/mcp/asset/5719d416-6033-44e7-b264-2ea2e25f1e3c';

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
    <ScreenContainer testID="login-screen">
      <Pressable
        testID="language-switcher"
        onPress={toggleLanguage}
        style={styles.languagePill}
        accessibilityRole="button"
        accessibilityLabel={t('auth.login.languageSwitcher', 'MN/EN')}
      >
        <Text style={styles.languagePillText}>MN/EN</Text>
      </Pressable>

      <InsetScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraBottomInset={spacing.xl}
      >
        <View style={styles.brandBlock}>
          <View style={styles.brandIconWrap}>
            <View style={styles.brandGlow} />
            <View style={styles.brandIconCard}>
              <Image source={{ uri: figmaBrandIconUri }} style={styles.brandIcon} />
            </View>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>{t('auth.login.title', 'Tasky-д тавтай морил')}</Text>
            <Text style={styles.subtitleLine}>
              {t(
                'auth.login.description',
                'Найдвартай гүйцэтгэгчтэй холбогдож, ажлаа хялбар захиалаарай',
              )}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            testID="facebook-login-button"
            onPress={() => {
              void handleFacebookLogin();
            }}
            disabled={isFacebookLoading}
            style={({ pressed }) => [
              styles.facebookButton,
              pressed && !isFacebookLoading ? styles.pressed : null,
              isFacebookLoading ? styles.disabled : null,
            ]}
            accessibilityRole="button"
          >
            <View style={styles.facebookButtonContent}>
              {isFacebookLoading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Image source={{ uri: figmaFacebookIconUri }} style={styles.buttonIcon} />
                  <Text style={styles.facebookButtonText}>
                    {t('auth.login.facebookButton', 'Facebook-ээр нэвтрэх')}
                  </Text>
                </>
              )}
            </View>
          </Pressable>
        </View>

        <View style={styles.illustrationWrap} pointerEvents="none">
          <Image source={{ uri: figmaHeroTextureUri }} style={styles.illustration} />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Pressable
              onPress={() => router.push('/(shared)/legal/terms')}
              accessibilityRole="link"
            >
              <Text style={styles.footerLink}>{t('auth.login.terms', 'Үйлчилгээний нөхцөл')}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(shared)/legal/privacy')}
              accessibilityRole="link"
            >
              <Text style={styles.footerLink}>{t('auth.login.privacy', 'Нууцлалын бодлого')}</Text>
            </Pressable>
          </View>
          <Text style={styles.copyright}>
            {t('auth.login.copyright', '© 2024 Tasky. Бүх эрх хуулиар хамгаалагдсан.')}
          </Text>
        </View>

        {state === 'error' && errorMessage ? (
          <Text testID="login-error" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        {devAuthEnabled ? (
          <View style={styles.devSection}>
            <Text style={styles.devLabel}>{t('auth.devBypass', 'Dev bypass')}</Text>
            <Pressable
              style={styles.devButton}
              onPress={() => handleDevLoginAs('CUSTOMER')}
              disabled={busy}
            >
              <Text style={styles.devButtonText}>
                {t('auth.loginAsCustomer', 'Login as Customer')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.devButton}
              onPress={() => handleDevLoginAs('TASKER')}
              disabled={busy}
            >
              <Text style={styles.devButtonText}>{t('auth.loginAsTasker', 'Login as Tasker')}</Text>
            </Pressable>
            {devLogin.error ? <Text style={styles.errorText}>{devLogin.error.message}</Text> : null}
          </View>
        ) : null}
      </InsetScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  languagePill: {
    position: 'absolute',
    right: spacing.xl,
    top: spacing.xl,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(195,198,207,0.2)',
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 5,
    backgroundColor: colors.background,
  },
  languagePillText: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 72,
    paddingBottom: spacing['2xl'],
    gap: spacing.xl,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  brandBlock: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  brandIconWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGlow: {
    position: 'absolute',
    right: -16,
    top: -16,
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: 'rgba(253,206,106,0.2)',
    opacity: 0.9,
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
  brandIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  copyBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.primaryDeep,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitleLine: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 26,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.lg,
  },
  facebookButton: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDeep,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...elevations.card,
  },
  facebookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  facebookButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '600',
  },
  illustrationWrap: {
    opacity: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  illustration: {
    alignSelf: 'stretch',
    aspectRatio: 326 / 128,
    resizeMode: 'cover',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
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
  devButton: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
