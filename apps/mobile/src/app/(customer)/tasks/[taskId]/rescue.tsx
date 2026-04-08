import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function NoApplicantRescueScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — fetch task details, provide rescue actions

  return (
    <DetailTemplate testID="SCR-CUST-026">
      <View className="items-center py-xl gap-lg">
        <Lightbulb size={48} color={colors.secondary} />
        <Text className="text-heading font-semibold text-primaryDeep text-center">
          {t('customer.rescue.headline', 'No applicants yet')}
        </Text>
        <Text className="text-body text-mutedForeground text-center leading-6">
          {t('customer.rescue.body', 'Try adjusting your budget or schedule to attract more taskers.')}
        </Text>
        <Button
          label={t('customer.rescue.adjustTask', 'Adjust Task')}
          onPress={() => router.back()}
          className="self-stretch"
        />
        <Button
          label={t('customer.rescue.contactSupport', 'Contact Concierge')}
          variant="outline"
          onPress={() => {
            // TODO: wire concierge support
          }}
          className="self-stretch"
        />
      </View>
    </DetailTemplate>
  );
}
