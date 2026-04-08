import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

interface ReviewHardLockProps {
  bookingId: string;
}

export function ReviewHardLock({ bookingId }: ReviewHardLockProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleSubmitReview = () => {
    router.push(`/(shared)/review/${bookingId}`);
  };

  return (
    <View style={styles.container} testID="review-hard-lock">
      <View style={styles.iconShell}>
        <Lock size={30} color={colors.primary} />
      </View>
      <Text style={styles.title}>{t('shared.review.hardLockTitle')}</Text>
      <Text style={styles.body}>
        {t('ReviewHardLock.copy1')}
      </Text>
      <Button
        label={t('shared.review.submit')}
        onPress={handleSubmitReview}
        style={styles.button}
        testID="review-hard-lock-cta"
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
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  button: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
