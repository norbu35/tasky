import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBookings } from '../hooks/useBookings';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export function BookingList() {
  const { t } = useTranslation();
  const { data, isLoading } = useBookings();

  if (isLoading) return <Text style={styles.loadingText}>{t('bookingList.loading')}</Text>;

  return (
    <FlatList
      data={data?.data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.status}>{item.status}</Text>
          <Text style={styles.id}>
            {t('bookingList.taskId')}: {item.task_id.slice(0, 8)}...
          </Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>{t('bookingList.empty')}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    ...elevations.soft,
  },
  status: {
    fontSize: typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.foreground,
  },
  id: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing['2xl'],
    color: colors.textSecondary,
  },
  loadingText: {
    padding: 20,
  },
});
