import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useDeleteAccount } from '../../../features/profile/hooks/useDeleteAccount';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function AccountDeletionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: deleteAccount, isPending, error } = useDeleteAccount();
  const [confirmationText, setConfirmationText] = React.useState('');

  const isBlocked = error && (error as any)?.code === 'ACTIVE_BOOKINGS';
  const isDisputeBlocked = error && (error as any)?.code === 'OPEN_DISPUTES';
  const canDelete = confirmationText.trim().toUpperCase() === 'DELETE';

  const handleDelete = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        router.replace('/(auth)');
      },
    });
  };

  return (
    <View testID="SCR-SHARED-015" className="flex-1 bg-background justify-center">
      <View className="px-lg items-center">
        <View className="w-[72px] h-[72px] rounded-full bg-muted items-center justify-center mb-lg">
          <AlertTriangle size={48} color={colors.danger} />
        </View>

        <Text className="text-title font-bold text-foreground text-center mb-md">
          {t('shared.profile.deleteTitle', 'Бүртгэл устгах')}
        </Text>

        {isBlocked ? (
          <>
            <Text className="text-body text-text-secondary text-center mb-xl" style={{ lineHeight: 24 }}>
              {t(
                'shared.profile.deleteBlockedBookings',
                'Танд идэвхтэй захиалга байна. Бүртгэлээ устгахын өмнө бүх захиалгаа дуусгах эсвэл цуцлах шаардлагатай.',
              )}
            </Text>
            <Button
              label={t('shared.profile.understood', 'Ойлголоо')}
              variant="outline"
              onPress={() => router.back()}
              style={{ alignSelf: 'stretch' }}
            />
          </>
        ) : isDisputeBlocked ? (
          <>
            <Text className="text-body text-text-secondary text-center mb-xl" style={{ lineHeight: 24 }}>
              {t(
                'shared.profile.deleteBlockedDisputes',
                'Танд шийдвэрлэгдээгүй маргаан байна. Бүртгэлээ устгахын өмнө бүх маргааныг шийдвэрлэх шаардлагатай.',
              )}
            </Text>
            <Button
              label={t('shared.profile.understood', 'Ойлголоо')}
              variant="outline"
              onPress={() => router.back()}
              style={{ alignSelf: 'stretch' }}
            />
          </>
        ) : (
          <>
            <Text className="text-body text-text-secondary text-center mb-xl" style={{ lineHeight: 24 }}>
              {t(
                'shared.profile.deleteWarning',
                'Та бүртгэлээ устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй бөгөөд таны бүх мэдээлэл бүрмөсөн устгагдана.',
              )}
            </Text>
            <Text className="text-label text-foreground font-semibold self-stretch mb-sm">
              {t(
                'shared.profile.deleteConfirmationPrompt',
                "Баталгаажуулахын тулд 'DELETE' гэж бичнэ үү",
              )}
            </Text>
            <Input
              testID="delete-confirmation-input"
              value={confirmationText}
              onChangeText={setConfirmationText}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={t('shared.profile.deleteConfirmationPlaceholder', 'DELETE')}
              style={{ alignSelf: 'stretch', marginBottom: 24 }}
            />

            <View className="self-stretch gap-sm">
              <Button
                label={t('shared.profile.deleteConfirm', 'Бүртгэлээ устгах')}
                variant="destructive"
                onPress={handleDelete}
                isLoading={isPending}
                disabled={isPending || !canDelete}
                style={{ alignSelf: 'stretch' }}
                testID="delete-confirm-button"
              />
              <Button
                label={t('shared.profile.deleteCancel', 'Болих')}
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
  );
}
