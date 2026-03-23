import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../../components/ui/Button';

const { colors, spacing, typography } = mobileTheme;

export default function SessionExpiredScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogin = useCallback(() => {
    router.replace('/(auth)');
  }, [router]);

  return (
    <View style={styles.container} testID="session-expired-screen">
      <LogIn size={48} color={colors.primary} />
      <Text style={styles.title}>{t('infra.sessionExpired.title', 'Session Expired')}</Text>
      <Text style={styles.body}>
        {t('infra.sessionExpired.body', 'Please log in again to continue')}
      </Text>
      <Button
        label={t('infra.sessionExpired.loginButton', 'Log In')}
        onPress={handleLogin}
        style={styles.loginButton}
        testID="session-expired-screen-login"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  body: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.body * 1.6,
  },
  loginButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
