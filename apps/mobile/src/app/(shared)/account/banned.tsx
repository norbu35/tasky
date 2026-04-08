import React from 'react';
import { Linking, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ban } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function BannedAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View testID="SCR-SHARED-021" className="flex-1 justify-center items-center px-lg bg-background">
      <View
        className="w-[72px] h-[72px] rounded-full items-center justify-center mb-lg"
        style={{ backgroundColor: `${colors.danger}1A` }}
      >
        <Ban size={32} color={colors.danger} />
      </View>
      <Text className="text-title font-bold text-foreground text-center mb-md">
        {t('shared.account.bannedTitle')}
      </Text>
      <Text className="text-body text-textSecondary text-center leading-6">
        {t('BannedAccountScreen.copy1')}
      </Text>
      <Button
        label={t('shared.account.contactSupport')}
        variant="ghost"
        onPress={() => {
          void Linking.openURL('mailto:support@tasky.mn');
        }}
        className="self-stretch mt-xl"
        testID="banned-support-button"
      />
      <Button
        label={t('shared.account.logout')}
        onPress={() => router.replace('/(auth)')}
        className="self-stretch mt-sm"
        testID="banned-logout-button"
      />
    </View>
  );
}
