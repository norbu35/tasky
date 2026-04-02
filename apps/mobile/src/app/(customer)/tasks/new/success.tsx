import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Sparkles } from 'lucide-react-native';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { Button } from '../../../../components/ui/Button';

const { colors, spacing, radius, typography } = mobileTheme;

export default function TaskPostedSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();

  const handleViewTask = () => {
    if (taskId) {
      router.replace(`/(customer)/tasks/${taskId}`);
      return;
    }
    router.replace('/(customer)/tasks');
  };

  const handleDone = () => {
    router.replace('/(customer)/tasks');
  };

  return (
    <SafeAreaView style={styles.container} testID="task-posted-success-screen">
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Sparkles size={18} color={colors.primaryDeep} />
        </View>
        <View style={styles.checkWrap}>
          <CheckCircle2 size={80} color={colors.verified} />
        </View>
        <Text style={styles.headline}>{t('customer.postTask.successTitle', 'Task posted successfully!')}</Text>
        <Text style={styles.body}>
          {t(
            'customer.postTask.successBody',
            'Taskers can now see your task and apply. You will be notified when new applications arrive',
          )}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t('customer.postTask.successNextTitle', 'What happens next')}
        </Text>
        <Text style={styles.cardBody}>
          {t('customer.postTask.successNext1', "You'll get applications soon")}
        </Text>
        <Text style={styles.cardBody}>
          {t('customer.postTask.successNext2', 'Review Tasker profiles and ratings')}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={t('customer.postTask.successCta', 'View Task')}
          onPress={handleViewTask}
          testID="task-posted-success-screen-cta"
        />
        <Pressable
          onPress={handleDone}
          style={styles.doneButton}
          accessibilityRole="button"
          testID="task-posted-success-screen-done"
        >
          <Text style={styles.doneLabel}>{t('customer.postTask.successDone', 'Done')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}14`,
  },
  checkWrap: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.verified}12`,
  },
  headline: {
    fontSize: typography.title,
    fontWeight: '900',
    color: colors.primaryDeep,
    textAlign: 'center',
    lineHeight: typography.title * 1.2,
  },
  body: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  cardBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.6,
  },
  actions: {
    gap: spacing.sm,
  },
  doneButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  doneLabel: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
});
