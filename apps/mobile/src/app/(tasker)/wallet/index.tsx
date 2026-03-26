import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function WalletScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="wallet-screen">
      <Text style={styles.navTitle}>Хэтэвч</Text>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Боломжит үлдэгдэл</Text>
        <Text style={styles.heroAmount}>₮120,000</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Нийт орлого</Text>
          <Text style={styles.statValue}>₮450,000</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Хүлээгдэж буй</Text>
          <Text style={styles.statValue}>₮80,000</Text>
        </View>
      </View>
      <Button label="Мөнгө татах" onPress={() => router.push('/(tasker)/wallet/payout')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  navTitle: { fontSize: typography.heading, fontWeight: '700', color: colors.primaryDeep },
  heroCard: { backgroundColor: '#f4f3f0', borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  heroLabel: { fontSize: typography.label, color: colors.textSecondary },
  heroAmount: { fontSize: 32, fontWeight: '800', color: colors.primaryDeep },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: radius.md, padding: spacing.lg },
  statLabel: { fontSize: typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  statValue: { fontSize: typography.body, fontWeight: '700', color: colors.primaryDeep },
});
