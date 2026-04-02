import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useDeleteAccount } from '../../../features/profile/hooks/useDeleteAccount';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

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
    <View style={styles.container} testID="delete-account-screen">
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={48} color={colors.danger} />
        </View>

        <Text style={styles.title}>{t('shared.profile.deleteTitle', 'Бүртгэл устгах')}</Text>

        {isBlocked ? (
          <>
            <Text style={styles.body}>
              {t(
                'shared.profile.deleteBlockedBookings',
                'Танд идэвхтэй захиалга байна. Бүртгэлээ устгахын өмнө бүх захиалгаа дуусгах эсвэл цуцлах шаардлагатай.',
              )}
            </Text>
            <Button
              label={t('shared.profile.understood', 'Ойлголоо')}
              variant="outline"
              onPress={() => router.back()}
              style={styles.button}
            />
          </>
        ) : isDisputeBlocked ? (
          <>
            <Text style={styles.body}>
              {t(
                'shared.profile.deleteBlockedDisputes',
                'Танд шийдвэрлэгдээгүй маргаан байна. Бүртгэлээ устгахын өмнө бүх маргааныг шийдвэрлэх шаардлагатай.',
              )}
            </Text>
            <Button
              label={t('shared.profile.understood', 'Ойлголоо')}
              variant="outline"
              onPress={() => router.back()}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Text style={styles.body}>
              {t(
                'shared.profile.deleteWarning',
                'Та бүртгэлээ устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй бөгөөд таны бүх мэдээлэл бүрмөсөн устгагдана.',
              )}
            </Text>
            <Text style={styles.confirmationLabel}>
              {t('shared.profile.deleteConfirmationPrompt', "Баталгаажуулахын тулд 'DELETE' гэж бичнэ үү")}
            </Text>
            <Input
              testID="delete-confirmation-input"
              value={confirmationText}
              onChangeText={setConfirmationText}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={t('shared.profile.deleteConfirmationPlaceholder', 'DELETE')}
              style={styles.confirmationInput}
            />

            <View style={styles.actions}>
              <Button
                label={t('shared.profile.deleteConfirm', 'Бүртгэлээ устгах')}
                variant="destructive"
                onPress={handleDelete}
                isLoading={isPending}
                disabled={isPending || !canDelete}
                style={styles.button}
                testID="delete-confirm-button"
              />
              <Button
                label={t('shared.profile.deleteCancel', 'Болих')}
                variant="ghost"
                onPress={() => router.back()}
                disabled={isPending}
                style={styles.button}
                testID="delete-cancel-button"
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  confirmationLabel: {
    fontSize: typography.label,
    color: colors.foreground,
    fontWeight: '600',
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  confirmationInput: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  button: {
    width: '100%',
  },
});
