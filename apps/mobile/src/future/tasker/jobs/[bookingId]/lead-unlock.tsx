import { useRouter } from 'expo-router';
import { Unlock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function LeadUnlockScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — fetch lead details, credit balance, accept/decline handlers

  return (
    <DetailTemplate testID="SCR-TASK-017">
      <View className="items-center py-xl gap-lg">
        <Unlock size={48} color={colors.primary} />
        <Text className="text-heading font-semibold text-primary-deep text-center">
          {t('tasker.leadUnlock.headline')}
        </Text>
        <Text className="text-body text-muted-foreground text-center leading-6">
          {t('tasker.leadUnlock.body')}
        </Text>
        <Button
          label={t('tasker.leadUnlock.accept')}
          onPress={() => {
            // TODO: wire accept + credit deduction
            router.back();
          }}
          className="self-stretch"
        />
        <Button
          label={t('tasker.leadUnlock.decline')}
          variant="outline"
          onPress={() => router.back()}
          className="self-stretch"
        />
      </View>
    </DetailTemplate>
  );
}
