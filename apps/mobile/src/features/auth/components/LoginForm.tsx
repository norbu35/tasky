import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, Alert } from 'react-native';

import { Button, FormField, Input } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';
import {
  DEV_LOGIN_CUSTOMER_PHONE,
  DEV_LOGIN_TASKER_PHONE,
  useRequestOtp,
  useVerifyOtp,
  useDevLogin,
} from '../hooks/useAuth';

const { colors, spacing, typography } = mobileTheme;

export function LoginForm() {
  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;
  const devAuthEnabled = runtimeEnv?.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true';
  const [phone, setPhone] = useState('+976');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'options' | 'phone' | 'otp'>('options');

  const { t } = useTranslation();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const devLogin = useDevLogin();

  const handleRequest = () => {
    requestOtp.mutate(phone, {
      onSuccess: () => setStep('otp'),
      onError: (err) => console.error(err),
    });
  };

  const handleVerify = () => {
    verifyOtp.mutate({ phone, code });
  };

  const handleDevLoginAs = (role: 'CUSTOMER' | 'TASKER') => {
    const phone = role === 'CUSTOMER' ? DEV_LOGIN_CUSTOMER_PHONE : DEV_LOGIN_TASKER_PHONE;
    devLogin.mutate({ phone, role });
  };

  const handleFacebookLogin = () => {
    Alert.alert(t('auth.comingSoon'), t('auth.facebookComingSoon'));
  };

  const busy = requestOtp.isPending || verifyOtp.isPending || devLogin.isPending;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.welcome')}</Text>

      {step === 'options' && (
        <View style={styles.optionsContainer}>
          <Button
            label={t('auth.continueFacebook')}
            onPress={handleFacebookLogin}
            style={styles.fbButton}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.line} />
          </View>

          <Button
            label={t('auth.continuePhone')}
            variant="outline"
            onPress={() => setStep('phone')}
          />

          {devAuthEnabled && (
            <>
              <Button
                label={t('LoginForm.copy1')}
                variant="secondary"
                onPress={() => handleDevLoginAs('CUSTOMER')}
                style={styles.devButton}
                isLoading={busy}
              />
              <Button
                label={t('LoginForm.copy2')}
                variant="secondary"
                onPress={() => handleDevLoginAs('TASKER')}
                style={styles.devButtonTasker}
                isLoading={busy}
              />
            </>
          )}
        </View>
      )}

      {step === 'phone' && (
        <FormField label={t('auth.phoneNumber')}>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            editable={!busy && step === 'phone'}
          />
        </FormField>
      )}

      {step === 'otp' && (
        <FormField label={t('auth.otpCode')}>
          <Input
            value={code}
            onChangeText={setCode}
            placeholder={t('auth.otpPlaceholder')}
            keyboardType="number-pad"
          />
        </FormField>
      )}

      <View style={styles.actions}>
        {step === 'phone' && (
          <Button label={t('auth.continue')} onPress={handleRequest} isLoading={busy} />
        )}

        {step === 'otp' && (
          <Button label={t('auth.verifyLogin')} onPress={handleVerify} isLoading={busy} />
        )}

        {(step === 'phone' || step === 'otp') && (
          <Button
            label={t('common.back')}
            variant="ghost"
            onPress={() => setStep(step === 'otp' ? 'phone' : 'options')}
            disabled={busy}
            style={styles.backButton}
          />
        )}
      </View>

      {(requestOtp.error || verifyOtp.error || devLogin.error) && (
        <Text style={styles.error}>
          {requestOtp.error?.message || verifyOtp.error?.message || devLogin.error?.message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: 'bold',
    marginBottom: spacing['2xl'],
    textAlign: 'center',
    color: colors.foreground,
  },
  optionsContainer: {
    alignSelf: 'stretch',
  },
  fbButton: {
    backgroundColor: colors.accent, // Facebook-style CTA
    marginBottom: spacing.xl,
  },
  devButton: {
    marginTop: spacing['2xl'],
    backgroundColor: colors.secondary,
  },
  devButtonTasker: {
    marginTop: spacing.sm,
    backgroundColor: colors.secondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  actions: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 8,
  },
});
