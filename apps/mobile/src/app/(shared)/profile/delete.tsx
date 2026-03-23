import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { useDeleteAccount } from '../../../features/profile/hooks/useDeleteAccount';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function AccountDeletionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: deleteAccount, isPending, error } = useDeleteAccount();

  const isBlocked = error && (error as any)?.code === 'ACTIVE_BOOKINGS';

  const handleDelete = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        router.replace('/');
      },
    });
  };

  return (
    <View style={styles.container} testID="delete-account-screen">
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={48} color={colors.danger} />
        </View>

        <Text style={styles.title}>{t('shared.profile.deleteTitle', 'Delete Account')}</Text>

        {isBlocked ? (
          <>
            <Text style={styles.body}>
              {t(
                'shared.profile.deleteBlockedBookings',
                'You have active bookings. You must complete or cancel all bookings before deleting your account.',
              )}
            </Text>
            <Button
              label={t('shared.profile.understood', 'Understood')}
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
                'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
              )}
            </Text>

            <View style={styles.actions}>
              <Button
                label={t('shared.profile.deleteConfirm', 'Delete My Account')}
                variant="destructive"
                onPress={handleDelete}
                isLoading={isPending}
                disabled={isPending}
                style={styles.button}
                testID="delete-confirm-button"
              />
              <Button
                label={t('shared.profile.deleteCancel', 'Cancel')}
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
  button: {
    width: '100%',
  },
});
