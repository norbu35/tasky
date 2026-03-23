import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AuthTemplate } from '../../../components/templates/AuthTemplate';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

interface VerificationGateProps {
  onStartVerification: () => void;
  onMaybeLater: () => void;
  testID?: string;
}

const BENEFITS = [
  'tasker.verification.benefit1',
  'tasker.verification.benefit2',
  'tasker.verification.benefit3',
] as const;

export function VerificationGate({
  onStartVerification,
  onMaybeLater,
  testID = 'verification-gate',
}: VerificationGateProps) {
  const { t } = useTranslation();

  return (
    <AuthTemplate
      headline={t('tasker.verification.gateTitle')}
      subtitle={t('tasker.verification.gateBody')}
      testID={testID}
    >
      <View style={styles.benefitsContainer}>
        {BENEFITS.map((benefitKey, index) => (
          <View key={index} style={styles.benefitRow}>
            <CheckCircle size={20} color={colors.verified} />
            <Text style={styles.benefitText}>{t(benefitKey)}</Text>
          </View>
        ))}
      </View>

      <Button
        label={t('tasker.verification.gateCta')}
        onPress={onStartVerification}
        style={styles.primaryCta}
        testID={`${testID}-cta`}
      />

      <Button
        label={t('tasker.verification.maybeLater', 'Maybe later')}
        variant="ghost"
        onPress={onMaybeLater}
        style={styles.secondaryCta}
        testID={`${testID}-secondary-cta`}
      />
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  benefitsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.primary,
    lineHeight: typography.body * 1.6,
  },
  primaryCta: {
    alignSelf: 'stretch',
  },
  secondaryCta: {
    alignSelf: 'stretch',
  },
});
