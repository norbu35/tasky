import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { openURL } from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../../components/ui/Button';

const { colors, spacing, typography } = mobileTheme;

const APP_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/tasky',
  android: 'https://play.google.com/store/apps/details?id=com.tasky',
  default: 'https://tasky.mn',
});

export default function AppUpdateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const isForce = params.type === 'force';

  const title = isForce
    ? t('infra.appUpdate.forceTitle', 'Update required')
    : t('infra.appUpdate.softTitle', 'New version available');

  const body = isForce
    ? t('infra.appUpdate.forceBody', 'An update is required to continue using the app')
    : t('infra.appUpdate.softBody', 'A new version is available. Update for a better experience');

  const handleUpdate = useCallback(() => {
    void openURL(APP_STORE_URL);
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container} testID="app-update-screen">
      <LinearGradient colors={['#FFFFFF', '#F2F1ED']} style={styles.iconCard}>
        <Download size={44} color={colors.primary} />
      </LinearGradient>
      <View style={styles.sparkle}>
        <Text style={styles.sparkleText}>✦</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.versionPill}>
        <Text style={styles.versionText}>
          {t('infra.appUpdate.currentVersion', 'current: 1.2.0')} →{' '}
          {t('infra.appUpdate.nextVersion', 'new: 1.3.0')}
        </Text>
      </View>
      <Button
        label={t('infra.appUpdate.softUpdate', 'Update')}
        onPress={handleUpdate}
        style={styles.updateButton}
        testID="app-update-screen-update"
      />
      {!isForce && (
        <Button
          label={t('infra.appUpdate.softDismiss', 'Later')}
          variant="ghost"
          onPress={handleDismiss}
          style={styles.dismissButton}
          testID="app-update-screen-dismiss"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  iconCard: {
    width: 92,
    height: 92,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  sparkle: {
    position: 'absolute',
    top: '34%',
    right: spacing['3xl'],
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4C96B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleText: {
    color: colors.primary,
    fontSize: 16,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  body: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.body * 1.6,
  },
  versionPill: {
    marginTop: spacing.xl,
    borderRadius: 999,
    backgroundColor: '#EFEEEB',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  versionText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  updateButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
    minHeight: 54,
    borderRadius: 12,
  },
  dismissButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
