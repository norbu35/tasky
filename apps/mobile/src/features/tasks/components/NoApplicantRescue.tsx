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
  description,
  onPress,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.optionButton} onPress={onPress}>
      <View style={styles.optionIcon}>
        <Icon size={20} color={colors.primary} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
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
        <Text style={styles.introText}>
          {t('customer.noApplicantRescue.intro', 'Boost your task to get responses faster.')}
        </Text>

        <RescueOption
          icon={Banknote}
          label={t('customer.noApplicantRescue.adjustBudget', 'Increase Budget')}
          description={t(
            'customer.noApplicantRescue.adjustBudgetDescription',
            'Raise the offer to attract more qualified taskers.',
          )}
          onPress={onAdjustBudget}
        />

        <RescueOption
          icon={Calendar}
          label={t('customer.noApplicantRescue.adjustSchedule', 'Change Schedule')}
          description={t(
            'customer.noApplicantRescue.adjustScheduleDescription',
            'Move the schedule to a time with stronger availability.',
          )}
          onPress={onAdjustSchedule}
        />

        <RescueOption
          icon={Headphones}
          label={t('customer.noApplicantRescue.requestConcierge', 'Request Help')}
          description={t(
            'customer.noApplicantRescue.requestConciergeDescription',
            'Ask Tasky concierge to help review and rescue this task.',
          )}
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
  introText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  optionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  optionLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.foreground,
  },
  optionDescription: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
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
