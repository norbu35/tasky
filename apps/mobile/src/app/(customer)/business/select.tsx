import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../../components/shells';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';

export default function SelectBusinessAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  // TODO: wire real data — fetch business accounts for selection

  return (
    <ScreenContainer testID="SCR-B2B-005">
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); router.back(); }}
        title={t('b2b.select.title')}
        testID="select-business-sheet"
      >
        <View className="gap-lg">
          <Text className="text-body text-mutedForeground text-center">
            {t('b2b.select.empty')}
          </Text>
          <Button
            label={t('b2b.dashboard.createAccount')}
            onPress={() => {
              setIsOpen(false);
              router.push('/(customer)/business/new/details');
            }}
            className="self-stretch"
          />
        </View>
      </ModalSheetTemplate>
    </ScreenContainer>
  );
}
