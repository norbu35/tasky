import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button } from '../../components/ui';
import { mobileTheme } from '../../design/tokenAdapter';
import { useDevLogin } from '../../features/auth/hooks/useAuth';

const { colors, spacing, typography } = mobileTheme;

type LoginState = 'default' | 'loading' | 'facebook_loading' | 'error';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [state, setState] = useState<LoginState>('default');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const devLogin = useDevLogin();

  const handleFacebookLogin = async () => {
    setState('facebook_loading');
    try {
      // Facebook OAuth placeholder -- will be wired to real SDK
      // Simulate async to show loading state
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
      showLogo
      headline={t('auth.login.title', 'Welcome to Tasky')}
      subtitle={t('auth.login.subtitle', "Mongolia's trusted service marketplace")}
      testID="login-screen"
    >
      {state === 'facebook_loading' && (
        <ActivityIndicator
          testID="facebook-login-loading"
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      )}

      <Button
        testID="facebook-login-button"
        label={t('auth.login.facebookButton', 'Continue with Facebook')}
        onPress={handleFacebookLogin}
        isLoading={state === 'facebook_loading'}
        style={styles.facebookButton}
      />

      {state === 'error' && errorMessage && (
        <Text testID="login-error" style={styles.errorText}>
          {errorMessage}
        </Text>
      )}

      {__DEV__ && (
        <View style={styles.devSection}>
          <Text style={styles.devLabel}>Dev bypass</Text>
          <Button
            label="Login as Customer"
            variant="secondary"
            onPress={() => handleDevLoginAs('CUSTOMER')}
            isLoading={busy}
            style={styles.devButton}
          />
          <Button
            label="Login as Tasker"
            variant="secondary"
            onPress={() => handleDevLoginAs('TASKER')}
            isLoading={busy}
            style={styles.devButton}
          />
          {devLogin.error && <Text style={styles.errorText}>{devLogin.error.message}</Text>}
        </View>
      )}
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  facebookButton: {
    backgroundColor: colors.trust,
  },
  loader: {
    marginBottom: spacing.md,
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
});
