import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from './Button';
import { mobileTheme } from '../../design/tokenAdapter';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react-native';

interface LoginRequiredCTAProps {
  message?: string;
}

export function LoginRequiredCTA({ message }: LoginRequiredCTAProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lock color={mobileTheme.colors.primary} size={48} />
      </View>
      <Text style={styles.title}>{t('auth.loginRequired') || 'Log in to continue'}</Text>
      <Text style={styles.description}>
        {message || t('auth.loginReason') || 'You need to be logged in to view this content.'}
      </Text>
      <Button
        label={t('auth.loginButton') || 'Log In or Sign Up'}
        onPress={() => router.push('/(auth)')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: mobileTheme.colors.background,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: mobileTheme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: mobileTheme.colors.foreground,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: mobileTheme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    maxWidth: 300,
  },
});
