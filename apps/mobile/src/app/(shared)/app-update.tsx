import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { openURL } from 'expo-linking';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../../components/ui/Button';

const { colors, radius, spacing, typography } = mobileTheme;

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
    ? t('infra.appUpdate.forceTitle', 'Шинэчлэлт шаардлагатай')
    : t('infra.appUpdate.softTitle', 'Шинэ хувилбар гарлаа');

  const body = isForce
    ? t(
        'infra.appUpdate.forceBody',
        'Аппыг үргэлжлүүлэн ашиглахын тулд шинэчлэлт хийх шаардлагатай',
      )
    : t(
        'infra.appUpdate.softBody',
        'Аппын шинэ хувилбар бэлэн болсон байна. Шинэчилж илүү сайн туршлагатай болоорой',
      );

  const handleUpdate = useCallback(() => {
    void openURL(APP_STORE_URL);
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container} testID="app-update-screen">
      <View style={styles.iconShell}>
        <Download size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Button
        label={t('infra.appUpdate.softUpdate', 'Шинэчлэх')}
        onPress={handleUpdate}
        style={styles.updateButton}
        testID="app-update-screen-update"
      />
      {!isForce && (
        <Button
          label={t('infra.appUpdate.softDismiss', 'Дараа нь')}
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
  iconShell: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  updateButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  dismissButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
