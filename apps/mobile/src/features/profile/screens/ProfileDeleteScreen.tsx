import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';
import { useDeleteAccount } from '@/features/profile/hooks/useDeleteAccount';

const { colors } = mobileTheme;
const { statusHero, paragraphLineHeight } = mobileSurfaces;

export default function ProfileDeleteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: deleteAccount, isPending, error } = useDeleteAccount();
  const [confirmationText, setConfirmationText] = React.useState('');

  const errCode = (error as { code?: string } | undefined)?.code;
  const isBlocked = error && errCode === 'ACTIVE_BOOKINGS';
  const isDisputeBlocked = error && errCode === 'OPEN_DISPUTES';
  const canDelete = confirmationText.trim().toUpperCase() === 'DELETE';

  const handleDelete = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        router.replace('/(auth)');
      },
    });
  };

  return (
    <ScreenContainer testID="SCR-SHARED-015">
      <View className="flex-1 justify-center">
        <View className="px-lg items-center">
          <View
            className="rounded-full bg-muted items-center justify-center mb-lg"
            style={{ width: statusHero.iconBox, height: statusHero.iconBox }}
          >
            <AlertTriangle size={24} color={colors.danger} />
          </View>

          <Text className="text-title font-bold text-foreground text-center mb-md">
            {t('shared.profile.deleteTitle')}
          </Text>

          {isBlocked ? (
            <>
              <Text
                className="text-body text-text-secondary text-center mb-xl"
                style={{ lineHeight: paragraphLineHeight }}
              >
                {t('AccountDeletionScreen.copy1')}
              </Text>
              <Button
                label={t('shared.profile.understood')}
                variant="outline"
                onPress={() => router.back()}
                style={{ alignSelf: 'stretch' }}
              />
            </>
          ) : isDisputeBlocked ? (
            <>
              <Text
                className="text-body text-text-secondary text-center mb-xl"
                style={{ lineHeight: paragraphLineHeight }}
              >
                {t('AccountDeletionScreen.copy2')}
              </Text>
              <Button
                label={t('shared.profile.understood')}
                variant="outline"
                onPress={() => router.back()}
                style={{ alignSelf: 'stretch' }}
              />
            </>
          ) : (
            <>
              <Text
                className="text-body text-text-secondary text-center mb-xl"
                style={{ lineHeight: paragraphLineHeight }}
              >
                {t('AccountDeletionScreen.copy3')}
              </Text>
              <Text className="text-label text-foreground font-semibold self-stretch mb-sm">
                {t('AccountDeletionScreen.copy4')}
              </Text>
              <Input
                testID="delete-confirmation-input"
                value={confirmationText}
                onChangeText={setConfirmationText}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={t('shared.profile.deleteConfirmationPlaceholder')}
                style={{ alignSelf: 'stretch', marginBottom: 24 }}
              />

              <View className="self-stretch gap-sm">
                <Button
                  label={t('shared.profile.deleteConfirm')}
                  variant="destructive"
                  onPress={handleDelete}
                  isLoading={isPending}
                  disabled={isPending || !canDelete}
                  style={{ alignSelf: 'stretch' }}
                  testID="delete-confirm-button"
                />
                <Button
                  label={t('shared.profile.deleteCancel')}
                  variant="ghost"
                  onPress={() => router.back()}
                  disabled={isPending}
                  style={{ alignSelf: 'stretch' }}
                  testID="delete-cancel-button"
                />
              </View>
            </>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
