import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Facebook, Zap } from 'lucide-react-native';
import { useDevLogin } from '../../features/auth/hooks/useAuth';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button } from '../../components/ui/Button';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { cn } from '../../lib/cn';

const { colors } = mobileTheme;

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
          className="rounded-md px-md bg-background"
          style={{
            borderWidth: 1,
            borderColor: 'rgba(195,198,207,0.2)',
            paddingVertical: 4,
          }}
          accessibilityRole="button"
          accessibilityLabel={t('auth.login.languageSwitcher', 'MN/EN')}
        >
          <Text className="text-caption font-sans-bold" style={{ color: colors.primaryDeep, letterSpacing: 0.35 }}>
            MN/EN
          </Text>
        </Pressable>
      }
      bottomSlot={
        <View className="gap-lg px-xl">
          <Button
            testID="facebook-login-button"
            onPress={() => {
              void handleFacebookLogin();
            }}
            disabled={isFacebookLoading}
            isLoading={isFacebookLoading}
            style={{ minHeight: 56, backgroundColor: colors.primaryDeep }}
          >
            {!isFacebookLoading ? (
              <View className="flex-row items-center gap-sm">
                <Facebook size={20} color={colors.primaryForeground} />
                <Text className="text-label font-sans-bold text-primary-foreground">
                  {t('auth.login.facebookButton', 'Facebook-ээр нэвтрэх')}
                </Text>
              </View>
            ) : undefined}
          </Button>

          {state === 'error' && errorMessage ? (
            <Text testID="login-error" className="text-body text-center" style={{ color: colors.danger }}>
              {errorMessage}
            </Text>
          ) : null}

          {devAuthEnabled ? (
            <View className="gap-sm border-t border-border pt-lg">
              <Text className="text-caption text-center uppercase" style={{ color: colors.textSecondary, letterSpacing: 1 }}>
                {t('auth.devBypass', 'Dev bypass')}
              </Text>
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
                <Text className="text-body text-center" style={{ color: colors.danger }}>{devLogin.error.message}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      }
      footerSlot={
        <View className="items-center gap-md">
          <Pressable
            testID="login-footer-terms"
            onPress={() => router.push('/(shared)/legal/terms')}
            accessibilityRole="link"
          >
            <Text className="text-body" style={{ color: colors.textSecondary }}>
              {t('auth.login.terms', 'Үйлчилгээний нөхцөл')}
            </Text>
          </Pressable>
          <Pressable
            testID="login-footer-privacy"
            onPress={() => router.push('/(shared)/legal/privacy')}
            accessibilityRole="link"
          >
            <Text className="text-body" style={{ color: colors.textSecondary }}>
              {t('auth.login.privacy', 'Нууцлалын бодлого')}
            </Text>
          </Pressable>
          <Text className="text-body text-center" style={{ color: colors.textSecondary, opacity: 0.6 }}>
            {t('auth.login.copyright', '© 2024 Tasky. Бүх эрх хуулиар хамгаалагдсан.')}
          </Text>
        </View>
      }
    >
      {/* Brand icon — replaces Figma asset */}
      <View className="items-center mb-lg">
        <View
          className="w-[80px] h-[80px] rounded-sm items-center justify-center"
          style={{ backgroundColor: colors.primaryDeep, ...elevations.card }}
        >
          <Zap size={32} color={colors.primaryForeground} />
        </View>
      </View>
    </AuthTemplate>
  );
}
