import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '../../components/shells';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { elevations } from '../../design/elevations';
import { mobileTheme, withAlpha } from '../../design/tokenAdapter';
import { mobileSurfaces } from '../../design/surfaces';

const { colors, radius, spacing } = mobileTheme;
const { otpMigration } = mobileSurfaces;

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
          paddingTop: otpMigration.heroTopInset,
          paddingBottom: spacing.lg,
          justifyContent: 'space-between',
        }}
        extraBottomInset={spacing.lg}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-lg">
          <View
            className="items-center justify-center"
            style={{
              width: otpMigration.iconButton,
              height: otpMigration.iconButton,
              borderRadius: radius.md,
            }}
          >
            <ArrowLeft size={20} color={colors.primaryDeep} />
          </View>
          <View
            className="items-center justify-center"
            style={{ width: otpMigration.heroCard, height: otpMigration.heroCard }}
          >
            <View
              style={{
                position: 'absolute',
                width: otpMigration.halo,
                height: otpMigration.halo,
                borderRadius: radius.lg,
                backgroundColor: withAlpha(colors.accent, 0.2),
              }}
            />
            <View
              className="items-center justify-center bg-muted"
              style={{ borderRadius: radius.lg, ...elevations.soft }}
            >
              <Shield size={24} color={colors.primaryDeep} />
            </View>
          </View>

          <Text
            className="text-heading font-extrabold text-center text-primary-deep"
            style={{ letterSpacing: otpMigration.headingTracking }}
          >
            {t('auth.otpMigration.heading')}
          </Text>
          {!isLoading ? (
            <Text
              className="text-body text-text-secondary text-center"
              style={{ maxWidth: otpMigration.bodyMaxWidth }}
            >
              {t('OtpMigrationScreen.copy1')}
            </Text>
          ) : null}
        </View>

        <View className="gap-xl">
          <FormField
            label={t('auth.otpMigration.label')}
            helperText={t('auth.otpMigration.helper')}
            errorText={
              showError
                ? t('auth.otpMigration.errorInvalidPhone')
                : showNetworkError
                  ? t('auth.otpMigration.errorNetwork')
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
                placeholder={t('auth.otpMigration.placeholder')}
                keyboardType="number-pad"
                maxLength={8}
                editable={!isLoading}
                invalid={showError}
                style={{ paddingLeft: otpMigration.phonePrefixInset }}
              />
            </View>
          </FormField>

          <Button
            testID="otp-migration-submit-button"
            label={t('auth.otpMigration.submit')}
            isLoading={isLoading}
            disabled={isSubmitDisabled}
            onPress={handleSubmit}
            style={{
              minHeight: otpMigration.submitHeight,
              borderRadius: radius.md,
              ...elevations.soft,
            }}
          />

          {!isLoading ? (
            <Button
              testID="otp-migration-skip-button"
              label={t('auth.otpMigration.skip')}
              variant="ghost"
              onPress={handleSkip}
              style={{ minHeight: otpMigration.skipHeight }}
            />
          ) : null}
        </View>
      </InsetScrollView>
    </ScreenContainer>
  );
}
