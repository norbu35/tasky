import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button } from '../../components/ui';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

type LoginState = 'default' | 'loading' | 'facebook_loading' | 'error';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [state, setState] = useState<LoginState>('default');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
});
