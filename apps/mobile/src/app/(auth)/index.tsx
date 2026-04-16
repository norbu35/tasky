import { useRouter } from 'expo-router';
import { LogIn, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button } from '../../components/ui/Button';
import { elevations } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';
import {
  DEV_LOGIN_CUSTOMER_PHONE,
  DEV_LOGIN_TASKER_PHONE,
  useDevLogin,
} from '../../features/auth/hooks/useAuth';

const { colors } = mobileTheme;

type LoginState = 'default' | 'facebook_loading' | 'error';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [state, setState] = useState<LoginState>('default');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const devLogin = useDevLogin();
  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;

  const devAuthEnabled = runtimeEnv?.['EXPO_PUBLIC_DEV_AUTH_ENABLED'] === 'true';
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
      setErrorMessage(t('auth.login.error'));
    }
  };

  const handleDevLoginAs = (role: 'CUSTOMER' | 'TASKER') => {
    const phone = role === 'CUSTOMER' ? DEV_LOGIN_CUSTOMER_PHONE : DEV_LOGIN_TASKER_PHONE;
    devLogin.mutate({ phone, role });
  };

  const toggleLanguage = () => {
    void i18n.changeLanguage(i18n.language === 'mn' ? 'en' : 'mn');
  };

  return (
    <AuthTemplate
      testID="SCR-SHARED-002"
      showLogo
      headline={t('auth.login.title')}
      topRightSlot={
        <Pressable
          testID="language-switcher"
          onPress={toggleLanguage}
          className="rounded-md px-md bg-background border border-[rgba(195,198,207,0.2)] py-xs"
          accessibilityRole="button"
          accessibilityLabel={t('auth.login.languageSwitcher')}
        >
          <Text className="text-caption font-sans-bold text-primary-deep tracking-[0.35px]">
            {t('LoginScreen.copy2')}
          </Text>
        </Pressable>
      }
      bottomSlot={
        <View className="gap-lg px-screen-x">
          <Button
            testID="facebook-login-button"
            onPress={() => {
              void handleFacebookLogin();
            }}
            disabled={isFacebookLoading}
            isLoading={isFacebookLoading}
            className="min-h-[56px] bg-primary-deep"
            style={{ alignSelf: 'stretch' }}
          >
            {!isFacebookLoading ? (
              <View className="flex-row items-center gap-sm">
                <LogIn size={20} color={colors.primaryForeground} />
                <Text className="text-label font-sans-bold text-primary-foreground">
                  {t('auth.login.facebookButton')}
                </Text>
              </View>
            ) : undefined}
          </Button>

          {state === 'error' && errorMessage ? (
            <Text testID="login-error" className="text-body text-center text-danger">
              {errorMessage}
            </Text>
          ) : null}

          {devAuthEnabled ? (
            <View className="gap-sm border-t border-border pt-lg">
              <Text className="text-caption text-center uppercase text-text-secondary tracking-[1px]">
                {t('auth.devBypass')}
              </Text>
              <Button
                testID="dev-login-customer"
                label={t('auth.loginAsCustomer')}
                variant="secondary"
                onPress={() => handleDevLoginAs('CUSTOMER')}
                disabled={busy}
              />
              <Button
                testID="dev-login-tasker"
                label={t('auth.loginAsTasker')}
                variant="secondary"
                onPress={() => handleDevLoginAs('TASKER')}
                disabled={busy}
              />
              {devLogin.error ? (
                <Text className="text-body text-center text-danger">{devLogin.error.message}</Text>
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
            <Text className="text-body text-text-secondary">{t('auth.login.terms')}</Text>
          </Pressable>
          <Pressable
            testID="login-footer-privacy"
            onPress={() => router.push('/(shared)/legal/privacy')}
            accessibilityRole="link"
          >
            <Text className="text-body text-text-secondary">{t('auth.login.privacy')}</Text>
          </Pressable>
          <Text className="text-body text-center text-text-secondary opacity-60">
            {t('auth.login.copyright')}
          </Text>
        </View>
      }
    >
      {/* Brand icon — replaces Figma asset */}
      <View className="items-center mb-lg">
        <View
          className="w-[80px] h-[80px] rounded-sm items-center justify-center bg-primary-deep"
          style={{ ...elevations.card }}
        >
          <Zap size={32} color={colors.primaryForeground} />
        </View>
      </View>
      {/* Subtitle — rendered at screen level with explicit wrap to prevent mid-word break (DEF-007) */}
      <Text
        testID="login-subtitle"
        className="text-body text-center mt-sm leading-relaxed text-primary shrink flex-wrap"
      >
        {t('LoginScreen.copy1')}
      </Text>
    </AuthTemplate>
  );
}
