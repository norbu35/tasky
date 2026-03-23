import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banknote, Calendar, Headphones } from 'lucide-react-native';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export interface NoApplicantRescueProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onAdjustBudget: () => void;
  onAdjustSchedule: () => void;
  onRequestConcierge: () => void;
}

function RescueOption({
  icon: Icon,
  label,
  onPress,
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.optionButton} onPress={onPress}>
      <View style={styles.optionIcon}>
        <Icon size={20} color={colors.primary} />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </Pressable>
  );
}

export function NoApplicantRescue({
  isOpen,
  onClose,
  taskId: _taskId,
  onAdjustBudget,
  onAdjustSchedule,
  onRequestConcierge,
}: NoApplicantRescueProps) {
  const { t } = useTranslation();

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.noApplicantRescue.title', 'No applicants yet')}
      testID="no-applicant-rescue"
      snapPoints={['55%']}
    >
      <View style={styles.content}>
        <RescueOption
          icon={Banknote}
          label={t('customer.noApplicantRescue.adjustBudget', 'Increase Budget')}
          onPress={onAdjustBudget}
        />

        <RescueOption
          icon={Calendar}
          label={t('customer.noApplicantRescue.adjustSchedule', 'Change Schedule')}
          onPress={onAdjustSchedule}
        />

        <RescueOption
          icon={Headphones}
          label={t('customer.noApplicantRescue.requestConcierge', 'Request Help')}
          onPress={onRequestConcierge}
        />

        <Pressable onPress={onClose} style={styles.dismissButton}>
          <Text style={styles.dismissText}>
            {t('customer.noApplicantRescue.dismiss', 'Dismiss')}
          </Text>
        </Pressable>
      </View>
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.foreground,
  },
  dismissButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
