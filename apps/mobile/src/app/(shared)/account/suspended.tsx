import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function SuspendedAccountScreen() {
  const { t } = useTranslation();
  const { expiryDate } = useLocalSearchParams<{ expiryDate?: string }>();

  return (
    <View style={styles.container} testID="suspended-screen">
      <Text style={styles.title}>{t('shared.account.suspendedTitle')}</Text>
      <Text style={styles.body}>{t('shared.account.suspendedBody')}</Text>
      {expiryDate && (
        <Text style={styles.expiry}>
          {t('shared.account.suspendedExpiry', { date: expiryDate })}
        </Text>
      )}
      <Button
        label={t('shared.account.suspendedAppeal')}
        onPress={() => {
          // Appeal flow - will be connected in a later phase
        }}
        style={styles.button}
        testID="suspended-appeal-button"
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
    lineHeight: typography.body * 1.5,
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
});
