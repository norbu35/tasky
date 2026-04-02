import React from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, spacing, typography, shadows } = mobileTheme;

type OtpState = 'default' | 'wrong_code' | 'expired' | 'verifying';

function resolveOtpState(value?: string): OtpState {
  if (value === 'wrong_code' || value === 'expired' || value === 'verifying') {
    return value;
  }
  return 'default';
}

export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; state?: string }>();
  const phone = typeof params.phone === 'string' && params.phone ? params.phone : '9911 2233';
  const state = resolveOtpState(typeof params.state === 'string' ? params.state : undefined);
  const [code, setCode] = React.useState('');

  const isExpired = state === 'expired';
  const isWrongCode = state === 'wrong_code';
  const isVerifying = state === 'verifying';
  const sanitizedCode = code.replace(/\D/g, '').slice(0, 4);

  const resendLabel = isExpired
    ? t('auth.otp.resend', 'Код дахин илгээх')
    : t('auth.otp.resendCountdown', 'Код дахин илгээх (60с)');

  const descriptionPrefix = t('auth.otp.descriptionPrefix', 'Бид таны ');
  const descriptionSuffix = t('auth.otp.descriptionSuffix', ' дугаарт 4 оронтой нууц код илгээлээ.');
  const activeCellIndex = sanitizedCode.length >= 4 ? 3 : sanitizedCode.length;

  return (
    <SafeAreaView style={styles.container} testID="otp-screen">
      <View style={styles.header} testID="otp-top-app-bar">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
          testID="otp-back-button"
        >
          <ArrowLeft size={18} color={colors.primaryDeep} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('auth.otp.heading', 'Код баталгаажуулах')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heading} testID="otp-heading">
            {t('auth.otp.heading', 'Код баталгаажуулах')}
          </Text>
          <Text style={styles.description} testID="otp-description">
            <Text style={styles.descriptionMuted}>{descriptionPrefix}</Text>
            <Text style={styles.phoneText}>{phone}</Text>
            <Text style={styles.descriptionMuted}>{descriptionSuffix}</Text>
          </Text>
        </View>

        <View
          style={[styles.codeShell, isWrongCode && styles.codeShellError]}
          testID="otp-code-input"
        >
          <TextInput
            testID="otp-code-input-field"
            style={styles.hiddenInput}
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
                style={[
                  styles.codeCell,
                  isActive ? styles.codeCellActive : undefined,
                  isWrongCode ? styles.codeCellError : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.codeCellText,
                    sanitizedCode[index] ? styles.codeCellTextActive : styles.codeCellTextMuted,
                  ]}
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
          style={({ pressed }) => [
            styles.resendButton,
            !isExpired && styles.resendButtonDisabled,
            pressed && isExpired ? styles.pressed : undefined,
          ]}
        >
          <RefreshCw size={12} color={isExpired ? colors.primaryDeep : colors.mutedForeground} />
          <Text style={[styles.resendLabel, !isExpired && styles.resendLabelMuted]}>
            {resendLabel}
          </Text>
        </Pressable>

        {(isWrongCode || isExpired) && (
          <View style={[styles.errorBlock, isExpired && styles.expiredBlock]}>
            <Text style={styles.errorText}>
              {isWrongCode
                ? t('auth.otp.errorWrongCode', 'Буруу код оруулсан байна. Дахин оролдоно уу.')
                : t('auth.otp.errorExpired', 'Кодын хугацаа дууссан. Шинэ код авна уу.')}
            </Text>
          </View>
        )}

        <View style={styles.securityCard} testID="otp-security-card">
          <View style={styles.securityIcon}>
            <ShieldCheck size={22} color={colors.primaryDeep} />
          </View>
          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>
              {t('auth.otp.securityTitle', 'Аюулгүй байдал')}
            </Text>
            <Text style={styles.securityBody}>
              {t(
                'auth.otp.securityBody',
                'Таны хувийн мэдээлэл болон гүйлгээ хамгаалагдсан. Нууц кодыг бусдад бүү дамжуул.',
              )}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer} testID="otp-fixed-cta">
        <Button
          testID="otp-verify-button"
          label={t('auth.otp.verify', 'Баталгаажуулах')}
          isLoading={isVerifying}
          disabled={sanitizedCode.length !== 4 || isVerifying}
          style={styles.verifyButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 64,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.muted,
  },
  headerTitle: {
    color: colors.primaryDeep,
    fontSize: typography.title,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  backButton: {
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
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    gap: spacing.md,
  },
  heading: {
    color: colors.primaryDeep,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 40,
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 26,
    textAlign: 'center',
  },
  descriptionMuted: {
    color: colors.textSecondary,
  },
  phoneText: {
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  codeShell: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  codeShellError: {
    opacity: 0.96,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  codeCell: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F3F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  codeCellActive: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  codeCellError: {
    borderColor: colors.danger,
  },
  codeCellText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    color: colors.primaryDeep,
  },
  codeCellTextActive: {
    color: colors.primaryDeep,
  },
  codeCellTextMuted: {
    opacity: 0.2,
  },
  resendButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendButtonDisabled: {
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.75,
  },
  resendLabel: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '600',
  },
  resendLabelMuted: {
    color: colors.mutedForeground,
  },
  errorBlock: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  expiredBlock: {
    marginTop: -spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: 20,
    textAlign: 'center',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#E9E8E5',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CDE1FF',
  },
  securityCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  securityTitle: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  securityBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19.5,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  verifyButton: {
    minHeight: 56,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
});
