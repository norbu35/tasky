import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { mobileTheme, elevations } from '../../../../design/tokenAdapter';
import { Button } from '../../../../components/ui/Button';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../../../../components/shells';

const { colors, spacing, radius, typography } = mobileTheme;

export default function TaskPostedSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const checkScale = useSharedValue(0.8);

  React.useEffect(() => {
    checkScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  }, [checkScale]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

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
    <ScreenContainer testID="task-posted-success-screen">
      <InsetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        extraBottomInset={120}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Animated.View style={[styles.checkWrap, animatedCheckStyle]}>
            <CheckCircle2 size={50} color={colors.verified} />
          </Animated.View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeLabel}>
              {t('customer.postTask.successBadge', 'БАТАЛГААЖСАН')}
            </Text>
          </View>
          <Text style={styles.headline}>
            {t('customer.postTask.successTitle', 'Task posted successfully!')}
          </Text>
          <Text style={styles.body}>
            {t(
              'customer.postTask.successBody',
              'Taskers can now see your task and apply. You will be notified when new applications arrive',
            )}
          </Text>
          <View style={styles.decorDots}>
            <View style={[styles.decorDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.decorDot, { backgroundColor: colors.secondary }]} />
            <View style={[styles.decorDot, { backgroundColor: colors.verified }]} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardDarkLabel}>
            {t('customer.postTask.successNextLabel', 'ДАРААГИЙН АЛХАМ')}
          </Text>
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
      </InsetScrollView>

      <StickyActionBar>
        <View style={styles.actions}>
          <Button
            label={t('customer.postTask.successCta', 'View Task')}
            onPress={handleViewTask}
            testID="task-posted-success-screen-cta"
          />
          <Button
            label="Дуусгах"
            variant="outline"
            onPress={handleDone}
            testID="task-posted-success-screen-done"
          />
        </View>
      </StickyActionBar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  checkWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.verified}1A`,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: `${colors.verified}1A`,
  },
  statusBadgeLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.verified,
  },
  decorDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  decorDot: {
    width: 8,
    height: 8,
    borderRadius: radius.xs,
  },
  headline: {
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.primaryDeep,
    textAlign: 'center',
    lineHeight: typography.heading * 1.25,
  },
  body: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    padding: spacing['2xl'],
    gap: spacing.sm,
    ...elevations.soft,
  },
  cardDarkLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.primaryDeep,
    marginBottom: spacing.xs,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});
