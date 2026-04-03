import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

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
    <View style={styles.container} testID="suspended-screen">
      <View style={styles.iconShell}>
        <TriangleAlert size={32} color={colors.danger} />
      </View>
      <Text style={styles.title}>{t('shared.account.suspendedTitle', 'Бүртгэл түр хаагдсан')}</Text>
      <Text style={styles.body}>
        {t(
          'shared.account.suspendedBody',
          'Таны хаягийг манай үйлчилгээний нөхцөл зөрчсөн тул түр хугацаагаар хязгаарлалаа.',
        )}
      </Text>
      {expiryDate && (
        <Text style={styles.expiry}>
          {t('shared.account.suspendedExpiry', { date: formatDate(expiryDate) })}
        </Text>
      )}
      <Button
        label={t('shared.account.suspendedAppeal', 'Гомдол гаргах')}
        onPress={() => {
          // Appeal flow - will be connected in a later phase
        }}
        style={styles.button}
        testID="suspended-appeal-button"
      />
      <Button
        label={t('shared.account.logout', 'Гарах')}
        variant="ghost"
        onPress={() => router.replace('/(auth)')}
        style={styles.secondaryButton}
        testID="suspended-logout-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  iconShell: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: `${colors.danger}1A`,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  expiry: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  secondaryButton: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
