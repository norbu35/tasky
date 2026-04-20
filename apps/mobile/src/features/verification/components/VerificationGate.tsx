import { CheckCircle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

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
      <View className="gap-md mb-lg">
        {BENEFITS.map((benefitKey, index) => (
          <View key={index} className="flex-row items-center gap-sm">
            <CheckCircle size={20} color={colors.verified} />
            <Text className="flex-1 text-body text-primary leading-relaxed">{t(benefitKey)}</Text>
          </View>
        ))}
      </View>

      <Button
        label={t('tasker.verification.gateCta')}
        onPress={onStartVerification}
        style={{ alignSelf: 'stretch' }}
        testID={`${testID}-cta`}
      />

      <Button
        label={t('tasker.verification.maybeLater')}
        variant="ghost"
        onPress={onMaybeLater}
        style={{ alignSelf: 'stretch' }}
        testID={`${testID}-secondary-cta`}
      />
    </AuthTemplate>
  );
}
