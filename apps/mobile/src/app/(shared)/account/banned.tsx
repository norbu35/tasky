import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function BannedAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.container} testID="banned-screen">
      <Text style={styles.title}>{t('shared.account.bannedTitle')}</Text>
      <Text style={styles.body}>{t('shared.account.bannedBody')}</Text>
      <Button
        label={t('shared.account.contactSupport')}
        variant="ghost"
        onPress={() => {
          void Linking.openURL('mailto:support@tasky.mn');
        }}
        style={styles.supportButton}
        testID="banned-support-button"
      />
      <Button
        label={t('shared.account.logout')}
        onPress={() => router.replace('/(auth)')}
        style={styles.logoutButton}
        testID="banned-logout-button"
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
  supportButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  logoutButton: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
