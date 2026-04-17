import { useLocalSearchParams } from 'expo-router';
import { ShieldCheck, RefreshCw } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';

import { InsetScrollView, ScreenContainer, StickyActionBar } from '../../components/shells';
import { Button } from '../../components/ui/Button';
import { elevations } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';
import { mobileSurfaces } from '../../design/surfaces';
import { cn } from '../../lib/cn';

const { colors, radius } = mobileTheme;
const { otp } = mobileSurfaces;

type OtpState = 'default' | 'wrong_code' | 'expired' | 'verifying';

function resolveOtpState(value?: string): OtpState {
  if (value === 'wrong_code' || value === 'expired' || value === 'verifying') {
    return value;
  }
  return 'default';
}

export default function OtpScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ phone?: string; state?: string }>();
  const phone = typeof params.phone === 'string' && params.phone ? params.phone : '9911 2233';
  const state = resolveOtpState(typeof params.state === 'string' ? params.state : undefined);
  const [code, setCode] = React.useState('');

  const isExpired = state === 'expired';
  const isWrongCode = state === 'wrong_code';
  const isVerifying = state === 'verifying';
  const sanitizedCode = code.replace(/\D/g, '').slice(0, 4);

  const resendLabel = isExpired ? t('auth.otp.resend') : t('auth.otp.resendCountdown');

  const descriptionPrefix = t('auth.otp.descriptionPrefix');
  const descriptionSuffix = t('OtpScreen.copy1');
  const activeCellIndex = sanitizedCode.length >= 4 ? 3 : sanitizedCode.length;

  return (
    <ScreenContainer testID="SCR-SHARED-003">
      <InsetScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: otp.contentTopInset,
          paddingBottom: otp.contentBottomInset,
          gap: otp.contentGap,
        }}
        extraBottomInset={otp.stickyInset}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-md">
          <Text
            className="text-heading font-sans-bold text-center"
            style={{ color: colors.primaryDeep, letterSpacing: -0.6 }}
            testID="otp-heading"
          >
            {t('auth.otp.heading')}
          </Text>
          <Text
            className="text-body text-center"
            style={{ color: colors.textSecondary, lineHeight: otp.descriptionLineHeight }}
            testID="otp-description"
          >
            <Text style={{ color: colors.textSecondary }}>{descriptionPrefix}</Text>
            <Text style={{ color: colors.primaryDeep, fontWeight: '700' }}>{phone}</Text>
            <Text style={{ color: colors.textSecondary }}>{descriptionSuffix}</Text>
          </Text>
        </View>

        <View
          className={cn(
            'self-center flex-row gap-sm py-md items-center',
            isWrongCode && 'opacity-[0.96]',
          )}
          style={isWrongCode ? { opacity: otp.wrongCodeOpacity } : undefined}
          testID="otp-code-input"
        >
          <TextInput
            testID="otp-code-input-field"
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
            value={sanitizedCode}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 4))}
            autoFocus
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            editable={!isVerifying && !isExpired}
            maxLength={4}
          />
          {Array.from({ length: 4 }).map((_, index) => {
            const digit = sanitizedCode[index] ?? '—';
            const isActive = index === activeCellIndex && sanitizedCode.length < 4 && !isVerifying;

            return (
              <View
                key={`${digit}-${index}`}
                testID="otp-code-cell"
                className="items-center justify-center border-2"
                style={[
                  {
                    width: otp.codeCellSize,
                    height: otp.codeCellSize,
                    borderRadius: radius.md,
                    backgroundColor: isActive ? colors.card : colors.muted,
                    borderColor: isWrongCode
                      ? colors.danger
                      : isActive
                        ? colors.primary
                        : 'transparent',
                  },
                  isActive ? elevations.soft : undefined,
                ]}
              >
                <Text
                  className="text-title font-sans-bold"
                  style={{
                    color: colors.primaryDeep,
                    opacity: sanitizedCode[index] ? 1 : 0.2,
                    lineHeight: 28,
                  }}
                >
                  {digit}
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable
          testID="otp-resend-link"
          accessibilityRole="button"
          onPress={() => {}}
          disabled={!isExpired}
          style={({ pressed }) => ({
            opacity: !isExpired
              ? otp.resendDisabledOpacity
              : pressed
                ? otp.resendPressedOpacity
                : 1,
          })}
          className="self-center flex-row items-center gap-sm py-sm px-md"
        >
          <RefreshCw size={12} color={isExpired ? colors.primaryDeep : colors.mutedForeground} />
          <Text
            className="text-label font-sans-semibold"
            style={{ color: isExpired ? colors.primaryDeep : colors.mutedForeground }}
          >
            {resendLabel}
          </Text>
        </Pressable>

        {(isWrongCode || isExpired) && (
          <View className="self-center px-md" style={isExpired ? { marginTop: -8 } : undefined}>
            <Text
              className="text-caption text-center"
              style={{ color: colors.danger, lineHeight: otp.errorLineHeight }}
            >
              {isWrongCode ? t('auth.otp.errorWrongCode') : t('auth.otp.errorExpired')}
            </Text>
          </View>
        )}

        <View
          className="flex-row items-start gap-md p-lg"
          style={{ backgroundColor: colors.muted, borderRadius: radius.lg }}
          testID="otp-security-card"
        >
          <View
            className="items-center justify-center"
            style={{
              width: otp.securityIconBox,
              height: otp.securityIconBox,
              borderRadius: radius.md,
              backgroundColor: colors.card,
            }}
          >
            <ShieldCheck size={22} color={colors.primaryDeep} />
          </View>
          <View className="flex-1 gap-xs">
            <Text className="text-label font-sans-bold" style={{ color: colors.primaryDeep }}>
              {t('auth.otp.securityTitle')}
            </Text>
            <Text
              className="text-caption"
              style={{ color: colors.textSecondary, lineHeight: otp.securityLineHeight }}
            >
              {t('OtpScreen.copy2')}
            </Text>
          </View>
        </View>
      </InsetScrollView>

      <StickyActionBar testID="otp-fixed-cta">
        <View className="px-lg pb-lg">
          <Button
            testID="otp-verify-button"
            label={t('auth.otp.verify')}
            isLoading={isVerifying}
            disabled={sanitizedCode.length !== 4 || isVerifying}
            style={[
              {
                minHeight: otp.verifyButtonHeight,
                borderRadius: radius.md,
                backgroundColor: colors.primaryDeep,
              },
              elevations.soft,
            ]}
          />
        </View>
      </StickyActionBar>
    </ScreenContainer>
  );
}
