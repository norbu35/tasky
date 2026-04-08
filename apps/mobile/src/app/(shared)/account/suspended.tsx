import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

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
    <View testID="SCR-SHARED-020" className="flex-1 justify-center items-center px-lg bg-background">
      <View
        className="w-[72px] h-[72px] rounded-full items-center justify-center mb-lg"
        style={{ backgroundColor: `${colors.danger}1A` }}
      >
        <TriangleAlert size={32} color={colors.danger} />
      </View>
      <Text className="text-title font-bold text-foreground text-center mb-md">
        {t('shared.account.suspendedTitle', 'Бүртгэл түр хаагдсан')}
      </Text>
      <Text className="text-body text-textSecondary text-center leading-6">
        {t(
          'shared.account.suspendedBody',
          'Таны хаягийг манай үйлчилгээний нөхцөл зөрчсөн тул түр хугацаагаар хязгаарлалаа.',
        )}
      </Text>
      {expiryDate && (
        <Text className="text-body font-semibold text-danger text-center mt-md">
          {t('shared.account.suspendedExpiry', { date: formatDate(expiryDate) })}
        </Text>
      )}
      <Button
        label={t('shared.account.suspendedAppeal', 'Гомдол гаргах')}
        onPress={() => {
          // Appeal flow - will be connected in a later phase
        }}
        className="self-stretch mt-xl"
        testID="suspended-appeal-button"
      />
      <Button
        label={t('shared.account.logout', 'Гарах')}
        variant="ghost"
        onPress={() => router.replace('/(auth)')}
        className="self-stretch mt-sm"
        testID="suspended-logout-button"
      />
    </View>
  );
}
