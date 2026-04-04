import { useTranslation } from 'react-i18next';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type SubscriptionState = 'eligible' | 'ineligible';
type SubscriptionStatus = 'idle' | 'confirming' | 'active';

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ state?: SubscriptionState; demoState?: string }>();
  const isLockedDemo = params.demoState === 'locked' || params.state === 'ineligible';
  const [status, setStatus] = React.useState<SubscriptionStatus>('idle');

  return (
    <View testID="SCR-P3-004" style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="subscription-screen"
      >
        <Text style={styles.title}>{t('tasker.subscription.title', 'Tasker Pro')}</Text>
        <Text style={styles.subtitle}>{t('tasker.subscription.heroTitle', 'Become a Tasker Pro')}</Text>

        {isLockedDemo ? (
          <View style={styles.card} testID="subscription-screen-locked">
            <Text style={styles.cardTitle}>{t('tasker.subscription.ineligibleTitle', 'Not eligible')}</Text>
            <Text style={styles.description}>
              {t('tasker.subscription.ineligibleDesc', 'Tasker Pro requires 4.5+ rating to be eligible')}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('tasker.subscription.planStandard', 'Standard')}</Text>
              <Text style={styles.description}>{t('tasker.subscription.planStandardDesc', 'More visibility and more trust.')}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('tasker.subscription.planPremium', 'Premium')}</Text>
              <Text style={styles.description}>{t('tasker.subscription.heroDescription', 'Priority boost and additional benefits.')}</Text>
            </View>
            {status === 'active' ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>{t('tasker.subscription.activeLabel', 'Active')}</Text>
              </View>
            ) : (
              <Button
                testID="subscription-screen-cta"
                label={t('tasker.subscription.subscribeAction', 'Subscribe')}
                onPress={() => setStatus('confirming')}
              />
            )}
          </>
        )}
      </ScrollView>

      {status === 'confirming' ? (
        <View style={styles.sheet} testID="subscription-confirm-sheet">
          <Text style={styles.sheetTitle}>{t('tasker.subscription.confirmTitle', 'Confirm your choice')}</Text>
          <Text style={styles.description}>{t('tasker.subscription.confirmBody', 'Activate Tasker Pro subscription?')}</Text>
          <Button
            testID="subscription-confirm"
            label={t('tasker.subscription.confirmTitle', 'Confirm')}
            onPress={() => setStatus('active')}
          />
          <Button label={t('tasker.subscription.cancelText', 'Cancel')} variant="ghost" onPress={() => setStatus('idle')} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.primaryDeep },
  subtitle: { fontSize: typography.title, fontWeight: '600', color: colors.primaryDeep },
  card: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: typography.title, fontWeight: '700', color: colors.primaryDeep },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.trustMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  activeText: { fontSize: typography.body, fontWeight: '700', color: colors.trustForeground },
  sheet: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  sheetTitle: { fontSize: typography.title, fontWeight: '700', color: colors.primaryDeep },
});
