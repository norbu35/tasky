import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { InsetScrollView, ScreenContainer } from '../../components/shells';

const { colors, radius, spacing } = mobileTheme;

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
    <ScreenContainer testID="SCR-SHARED-004">
      <InsetScrollView
        className="flex-1"
        contentContainerStyle={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: 72,
          paddingBottom: spacing.lg,
          justifyContent: 'space-between',
        }}
        extraBottomInset={spacing.lg}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-lg">
          <View
            className="w-[40px] h-[40px] items-center justify-center"
            style={{ borderRadius: radius.md }}
          >
            <ArrowLeft size={18} color={colors.primaryDeep} />
          </View>
          <View className="w-[96px] h-[96px] items-center justify-center">
            <View
              style={{
                position: 'absolute',
                width: 144,
                height: 144,
                borderRadius: radius.lg,
                backgroundColor: 'rgba(171, 201, 242, 0.2)',
              }}
            />
            <View
              className="w-[96px] h-[96px] items-center justify-center bg-muted"
              style={{ borderRadius: radius.lg, ...elevations.soft }}
            >
              <Shield size={28} color={colors.primaryDeep} />
            </View>
          </View>

          <Text
            className="text-heading font-extrabold text-center text-primary-deep"
            style={{ letterSpacing: -0.6, lineHeight: undefined }}
          >
            {t('auth.otpMigration.heading', 'Утасны дугаараа бүртгүүлнэ үү')}
          </Text>
          {!isLoading ? (
            <Text
              className="text-body text-text-secondary text-center"
              style={{ maxWidth: 320, lineHeight: undefined }}
            >
              {t(
                'auth.otpMigration.description',
                'Аюулгүй байдлыг сайжруулахын тулд утасны дугаараа нэмнэ үү',
              )}
            </Text>
          ) : null}
        </View>

        <View className="gap-xl">
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
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  position: 'absolute',
                  left: spacing.lg,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  zIndex: 1,
                }}
              >
                <Text className="text-label font-medium text-text-secondary">+976</Text>
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
                style={{ paddingLeft: 64 }}
              />
            </View>
          </FormField>

          <Button
            testID="otp-migration-submit-button"
            label={t('auth.otpMigration.submit', 'Код авах')}
            isLoading={isLoading}
            disabled={isSubmitDisabled}
            onPress={handleSubmit}
            style={{ minHeight: 56, borderRadius: radius.md, ...elevations.soft }}
          />

          {!isLoading ? (
            <Button
              testID="otp-migration-skip-button"
              label={t('auth.otpMigration.skip', 'Дараа хийх')}
              variant="ghost"
              onPress={handleSkip}
              style={{ minHeight: 44 }}
            />
          ) : null}
        </View>
      </InsetScrollView>
    </ScreenContainer>
  );
}
