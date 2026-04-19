import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenContainer } from '../../../components/shells/ScreenContainer';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';
import { mobileSurfaces } from '../../../design/surfaces';

const { colors } = mobileTheme;

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10).replace(/-/g, '.');
}

export default function SuspendedAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { expiryDate } = useLocalSearchParams<{ expiryDate?: string }>();

  return (
    <ScreenContainer testID="SCR-SHARED-020">
      <View className="flex-1 justify-center items-center px-lg">
        <View
          className="rounded-full items-center justify-center mb-lg"
          style={{
            width: mobileSurfaces.statusHero.iconBox,
            height: mobileSurfaces.statusHero.iconBox,
            backgroundColor: `${colors.danger}1A`,
          }}
        >
          <TriangleAlert size={24} color={colors.danger} />
        </View>
        <Text className="text-title font-bold text-foreground text-center mb-md">
          {t('shared.account.suspendedTitle')}
        </Text>
        <Text className="text-body text-text-secondary text-center leading-6">
          {t('SuspendedAccountScreen.copy1')}
        </Text>
        {expiryDate && (
          <Text className="text-body font-semibold text-danger text-center mt-md">
            {t('shared.account.suspendedExpiry', { date: formatDate(expiryDate) })}
          </Text>
        )}
        <Button
          label={t('shared.account.suspendedAppeal')}
          onPress={() => {
            // Appeal flow - will be connected in a later phase
          }}
          className="self-stretch mt-xl"
          testID="suspended-appeal-button"
        />
        <Button
          label={t('shared.account.logout')}
          variant="ghost"
          onPress={() => router.replace('/(auth)')}
          className="self-stretch mt-sm"
          testID="suspended-logout-button"
        />
      </View>
    </ScreenContainer>
  );
}
