import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

interface InstantMatchTaskerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  budgetLabel?: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

const DEFAULT_TASK_TITLE = 'Гэр цэвэрлэгээ';
const DEFAULT_BUDGET_LABEL = '₮45,000';
const DEFAULT_TIME_REMAINING = '5:00';

export function InstantMatchTaskerSheet({
  isOpen,
  onClose,
  taskTitle = DEFAULT_TASK_TITLE,
  budgetLabel = DEFAULT_BUDGET_LABEL,
  onAccept,
  onDecline,
}: InstantMatchTaskerSheetProps) {
  const [isAccepted, setIsAccepted] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsAccepted(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    setIsAccepted(false);
  }, [taskTitle, budgetLabel]);

  if (!isOpen) return null;

  const handleAccept = () => {
    setIsAccepted(true);
    onAccept?.();
  };

  const handleDecline = () => {
    onDecline?.();
    onClose();
  };

  if (isAccepted) {
    return (
      <View style={styles.scrim}>
        <View style={styles.sheet} testID="instant-match-sheet">
          <Text style={styles.title}>Амжилттай!</Text>
          <Text style={styles.description}>
            Шинэ захиалга үүслээ. Миний ажлууд хэсгээс харна уу
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.scrim}>
      <View style={styles.sheet} testID="instant-match-sheet">
        <View style={styles.handle} />
        <Text style={styles.title}>Шинэ санал!</Text>
        <Text style={styles.description}>Танд шинэ шууд холболтын санал ирлээ.</Text>
        <View style={styles.card}>
          <Text style={styles.taskTitle}>{taskTitle}</Text>
          <Text style={styles.budget}>{budgetLabel}</Text>
          <Text style={styles.timer}>{DEFAULT_TIME_REMAINING}</Text>
        </View>
        <Button testID="instant-match-accept" label="Хүлээн авах" onPress={handleAccept} />
        <Button label="Татгалзах" variant="ghost" onPress={handleDecline} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0, 36, 68, 0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d8d6d0',
    alignSelf: 'center',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  description: { fontSize: typography.body, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  taskTitle: { fontSize: typography.body, fontWeight: '700', color: colors.primaryDeep },
  budget: { fontSize: typography.label, color: colors.textSecondary },
  timer: { fontSize: typography.label, fontWeight: '700', color: colors.primaryDeep },
});
