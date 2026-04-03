import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ban } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function BannedAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.container} testID="banned-screen">
      <View style={styles.iconShell}>
        <Ban size={32} color={colors.danger} />
      </View>
      <Text style={styles.title}>{t('shared.account.bannedTitle', 'Бүртгэл хаагдсан')}</Text>
      <Text style={styles.body}>
        {t(
          'shared.account.bannedBody',
          'Таны бүртгэл үйлчилгээний нөхцөл зөрчсөний улмаас бүрмөсөн хаагдсан байна. Энэ шийдвэрийг буцаах боломжгүй.',
        )}
      </Text>
      <Button
        label={t('shared.account.contactSupport', 'Тусламж авах')}
        variant="ghost"
        onPress={() => {
          void Linking.openURL('mailto:support@tasky.mn');
        }}
        style={styles.supportButton}
        testID="banned-support-button"
      />
      <Button
        label={t('shared.account.logout', 'Гарах')}
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
  supportButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  logoutButton: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
