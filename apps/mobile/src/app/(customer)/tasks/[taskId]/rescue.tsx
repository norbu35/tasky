import { useRouter } from 'expo-router';
import { Lightbulb } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

export default function NoApplicantRescueScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — fetch task details, provide rescue actions

  return (
    <DetailTemplate testID="SCR-CUST-026">
      <View className="items-center py-xl gap-lg">
        <Lightbulb size={24} color={colors.secondary} />
        <Text className="text-heading font-semibold text-primary-deep text-center">
          {t('customer.rescue.headline')}
        </Text>
        <Text className="text-body text-muted-foreground text-center leading-6">
          {t('customer.rescue.body')}
        </Text>
        <Button
          label={t('customer.rescue.adjustTask')}
          onPress={() => router.back()}
          className="self-stretch"
        />
        <Button
          label={t('customer.rescue.contactSupport')}
          variant="outline"
          onPress={() => router.push('/(shared)/help')}
          className="self-stretch"
        />
      </View>
    </DetailTemplate>
  );
}
