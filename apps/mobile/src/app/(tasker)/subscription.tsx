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
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="subscription-screen"
      >
        <Text style={styles.title}>{t('tasker.subscription.title', 'Tasker Pro')}</Text>
        <Text style={styles.subtitle}>Tasker Pro болоорой</Text>

        {isLockedDemo ? (
          <View style={styles.card} testID="subscription-screen-locked">
            <Text style={styles.cardTitle}>Шаардлага хангаагүй</Text>
            <Text style={styles.description}>
              Tasker Pro бүртгэлд нийцэхийн тулд 4.5+ үнэлгээ шаардлагатай
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Стандарт</Text>
              <Text style={styles.description}>Илүү харагдах байдал ба илүү итгэлцэл.</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Премиум</Text>
              <Text style={styles.description}>Priority boost болон нэмэлт боломжууд.</Text>
            </View>
            {status === 'active' ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Идэвхтэй</Text>
              </View>
            ) : (
              <Button
                testID="subscription-screen-cta"
                label="Бүртгүүлэх"
                onPress={() => setStatus('confirming')}
              />
            )}
          </>
        )}
      </ScrollView>

      {status === 'confirming' ? (
        <View style={styles.sheet} testID="subscription-confirm-sheet">
          <Text style={styles.sheetTitle}>Сонголтоо шалгана уу</Text>
          <Text style={styles.description}>Tasker Pro subscription-ийг идэвхжүүлэх үү?</Text>
          <Button
            testID="subscription-confirm"
            label="Баталгаажуулах"
            onPress={() => setStatus('active')}
          />
          <Button label="Буцах" variant="ghost" onPress={() => setStatus('idle')} />
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
  description: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 24 },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbe8d6',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  activeText: { fontSize: typography.body, fontWeight: '700', color: '#214d24' },
  sheet: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  sheetTitle: { fontSize: typography.title, fontWeight: '700', color: colors.primaryDeep },
});
