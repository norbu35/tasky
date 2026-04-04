import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { elevations } from '../../../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

type EscrowState = 'shell' | 'confirm' | 'success' | 'error';

export default function EscrowScreen() {
  const params = useLocalSearchParams<{ state?: string; demoState?: string }>();
  const [state, setState] = React.useState<EscrowState>(() => {
    if (params.demoState === 'error') return 'error';
    if (params.state === 'escrowed') return 'success';
    return 'shell';
  });

  React.useEffect(() => {
    if (params.demoState === 'error') {
      setState('error');
      return;
    }

    if (params.state === 'escrowed') {
      setState('success');
      return;
    }

    setState('shell');
  }, [params.demoState, params.state]);

  if (state === 'error') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="booking-escrow-screen"
      >
        <View style={styles.errorCard} testID="booking-escrow-screen-error">
          <Text style={styles.cardTitle}>Төлбөр амжилтгүй</Text>
          <Text style={styles.description}>
            Эскроу төлбөрийг одоогоор үргэлжлүүлэх боломжгүй байна.
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (state === 'success') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="booking-escrow-screen"
      >
        <View style={styles.successCard}>
          <Text style={styles.cardTitle}>Төлбөр баталгаажлаа</Text>
          <Text style={styles.successTitle}>Эскроу амжилттай!</Text>
          <Text style={styles.description}>Төлбөр аюулгүй эскроу дансанд хадгалагдаж байна.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="booking-escrow-screen"
    >
      <View testID="escrow-screen">
        <Text style={styles.title}>Эскроу төлбөр</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Эскроу төлбөрөөр хамгаалалт нэмэх</Text>
          <Text style={styles.description}>
            Төлбөрийг аюулгүй данс руу байршуулна. Ажил дууссаны дараа л гүйцэтгэгч мөнгөө авна
          </Text>
        </View>

        <View style={styles.featureList}>
          <Text style={styles.featureItem}>Мөнгөн хамгаалалт</Text>
          <Text style={styles.featureItem}>Маргаан шийдвэрлэх боломж</Text>
          <Text style={styles.featureItem}>Автомат шилжүүлэг</Text>
        </View>

        <Button
          label="Эскроу ашиглах"
          onPress={() => setState('confirm')}
          testID="booking-escrow-screen-cta"
        />

        {state === 'confirm' && (
          <View style={styles.sheet} testID="booking-escrow-confirm-sheet">
            <Text style={styles.sheetTitle}>Баталгаажуулах</Text>
            <Text style={styles.sheetDescription}>
              Эскроу ашиглахыг баталгаажуулснаар төлбөр аюулгүй хадгалагдана.
            </Text>
            <Button
              label="Үргэлжлүүлэх"
              onPress={() => setState('success')}
              testID="booking-escrow-confirm"
            />
            <Pressable onPress={() => setState('shell')}>
              <Text style={styles.cancelText}>Буцах</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.primaryDeep },
  card: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    ...elevations.soft,
  },
  errorCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  successCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardTitle: { fontSize: typography.title, fontWeight: '700', color: colors.primaryDeep },
  successTitle: { fontSize: typography.body, fontWeight: '700', color: colors.primaryDeep },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  featureList: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  featureItem: { fontSize: typography.body, color: colors.primaryDeep, fontWeight: '500' },
  sheet: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sheetTitle: { fontSize: typography.title, fontWeight: '700', color: colors.primaryDeep },
  sheetDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  cancelText: { fontSize: typography.body, color: colors.textSecondary, textAlign: 'center' },
});
