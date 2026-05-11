import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, Alert } from 'react-native';

import { Button, FormField, Input } from '@/components/ui';
import { elevations } from '@/design/elevations';
import {
  DEV_LOGIN_CUSTOMER_PHONE,
  DEV_LOGIN_TASKER_PHONE,
  useRequestOtp,
  useVerifyOtp,
  useDevLogin,
} from '@/features/auth/hooks/useAuth';
import { parseError } from '@/utils/errorHandling';

export function LoginForm() {
  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;
  const devAuthEnabled = __DEV__ && runtimeEnv?.['EXPO_PUBLIC_DEV_AUTH_ENABLED'] === 'true';
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
    <View className="p-xl justify-center flex-1">
      <Text className="text-heading font-bold mb-2xl text-center text-foreground">
        {t('auth.welcome')}
      </Text>

      {step === 'options' && (
        <View className="self-stretch">
          <Button
            label={t('auth.continueFacebook')}
            onPress={handleFacebookLogin}
            className="bg-foreground mb-xl"
            style={elevations.card}
          />

          <View className="flex-row items-center my-xl">
            <View className="flex-1 h-px bg-border" />
            <Text className="mx-md text-text-tertiary font-medium">{t('auth.or')}</Text>
            <View className="flex-1 h-px bg-border" />
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
                className="mt-2xl bg-secondary"
                isLoading={busy}
              />
              <Button
                label={t('LoginForm.copy2')}
                variant="secondary"
                onPress={() => handleDevLoginAs('TASKER')}
                className="mt-sm bg-secondary"
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

      <View className="mt-xl">
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
            className="mt-xs"
          />
        )}
      </View>

      {(requestOtp.error || verifyOtp.error || devLogin.error) && (
        <Text className="text-danger mt-md text-center">
          {parseError(requestOtp.error || verifyOtp.error || devLogin.error)}
        </Text>
      )}
    </View>
  );
}
