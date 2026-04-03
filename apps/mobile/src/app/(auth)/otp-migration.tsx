import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';

const { colors, radius, spacing, typography } = mobileTheme;

type MigrationState = 'default' | 'invalid_phone' | 'verifying' | 'error_network';

function resolveState(value?: string): MigrationState {
  if (
    value === 'invalid_phone' ||
    value === 'verifying' ||
    value === 'error_network' ||
    value === 'network_error'
  ) {
    return value === 'network_error' ? 'error_network' : value;
  }
  return 'default';
}

export default function OtpMigrationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; state?: string }>();
  const state = resolveState(typeof params.state === 'string' ? params.state : undefined);
  const initialPhone =
    typeof params.phone === 'string' ? params.phone.replace(/\D/g, '').slice(0, 8) : '';
  const [phone, setPhone] = React.useState(initialPhone);
  const isValidPhone = /^\d{8}$/.test(phone);
  const showError = state === 'invalid_phone';
  const showNetworkError = state === 'error_network';
  const isLoading = state === 'verifying';
  const isSubmitDisabled = !isValidPhone || showError || isLoading;

  const handleSubmit = () => {
    if (!isValidPhone || isLoading) {
      return;
    }

    router.push({
      pathname: '/(auth)/otp',
      params: { phone },
    });
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} testID="otp-migration-screen">
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.backShell}>
            <ArrowLeft size={18} color={colors.primaryDeep} />
          </View>
          <View style={styles.securityShell}>
            <View style={styles.securityGlow} />
            <View style={styles.securityIconCard}>
              <Shield size={28} color={colors.primaryDeep} />
            </View>
          </View>

          <Text style={styles.heading}>
            {t('auth.otpMigration.heading', 'Утасны дугаараа бүртгүүлнэ үү')}
          </Text>
          {!isLoading ? (
            <Text style={styles.description}>
              {t(
                'auth.otpMigration.description',
                'Аюулгүй байдлыг сайжруулахын тулд утасны дугаараа нэмнэ үү',
              )}
            </Text>
          ) : null}
        </View>

        <View style={styles.formArea}>
          <FormField
            label={t('auth.otpMigration.label', 'Утасны дугаар')}
            helperText={t('auth.otpMigration.helper', 'Facebook нэвтрэлтэд утасны дугаар нэмнэ')}
            errorText={
              showError
                ? t('auth.otpMigration.errorInvalidPhone', 'Утасны дугаар буруу байна')
                : showNetworkError
                  ? t('auth.otpMigration.errorNetwork', 'Интернэт холболтоо шалгана уу')
                  : undefined
            }
          >
            <View style={styles.phoneInputShell}>
              <View style={styles.countryCodeShell}>
                <Text style={styles.countryCode}>+976</Text>
              </View>
              <Input
                testID="otp-migration-phone-input"
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 8))}
                placeholder={t('auth.otpMigration.placeholder', '9911 2233')}
                keyboardType="number-pad"
                maxLength={8}
                editable={!isLoading}
                invalid={showError}
                style={styles.phoneInput}
              />
            </View>
          </FormField>

          <Button
            testID="otp-migration-submit-button"
            label={t('auth.otpMigration.submit', 'Код авах')}
            isLoading={isLoading}
            disabled={isSubmitDisabled}
            onPress={handleSubmit}
            style={styles.submitButton}
          />

          {!isLoading ? (
            <Button
              testID="otp-migration-skip-button"
              label={t('auth.otpMigration.skip', 'Дараа хийх')}
              variant="ghost"
              onPress={handleSkip}
              style={styles.skipButton}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backShell: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 72,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  securityShell: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityGlow: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(171, 201, 242, 0.2)',
  },
  securityIconCard: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
    ...elevations.soft,
  },
  heading: {
    color: colors.primaryDeep,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 30,
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 320,
  },
  formArea: {
    gap: spacing.xl,
  },
  phoneInputShell: {
    position: 'relative',
  },
  countryCodeShell: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  countryCode: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  phoneInput: {
    paddingLeft: 64,
  },
  submitButton: {
    minHeight: 56,
    borderRadius: radius.md,
    ...elevations.soft,
  },
  skipButton: {
    minHeight: 44,
  },
});
