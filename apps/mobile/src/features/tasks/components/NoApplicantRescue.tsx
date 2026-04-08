import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banknote, CalendarDays, Headphones, Sparkles } from 'lucide-react-native';
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

function RescueButton({
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
    <Pressable onPress={onPress} style={styles.optionButton} accessibilityRole="button">
      <View style={styles.optionIconWrap}>
        <Icon size={18} color={colors.secondary} />
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
      testID="no-applicant-rescue"
      snapPoints={['86%']}
    >
      <View style={styles.iconWrap}>
        <View style={styles.iconOuter}>
          <Sparkles size={28} color={colors.secondary} />
        </View>
      </View>

      <Text style={styles.title}>{t('customer.noApplicantRescue.title')}</Text>

      <Text style={styles.description}>{t('NoApplicantRescue.copy1')}</Text>

      <View style={styles.cardStack}>
        <RescueButton
          icon={Banknote}
          label={t('customer.noApplicantRescue.adjustBudget')}
          description={t('NoApplicantRescue.copy2')}
          onPress={onAdjustBudget}
        />

        <RescueButton
          icon={CalendarDays}
          label={t('customer.noApplicantRescue.adjustSchedule')}
          description={t('NoApplicantRescue.copy3')}
          onPress={onAdjustSchedule}
        />

        <RescueButton
          icon={Headphones}
          label={t('customer.noApplicantRescue.requestConcierge')}
          description={t('NoApplicantRescue.copy4')}
          onPress={onRequestConcierge}
        />
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteText}>{t('NoApplicantRescue.copy5')}</Text>
      </View>

      <Pressable onPress={onClose} style={styles.dismissButton} accessibilityRole="button">
        <Text style={styles.dismissText}>{t('customer.noApplicantRescue.dismiss')}</Text>
      </Pressable>
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  iconOuter: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
    marginTop: spacing.sm,
  },
  cardStack: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  optionDescription: {
    fontSize: typography.caption,
    lineHeight: typography.caption * 1.5,
    color: colors.textSecondary,
  },
  noteCard: {
    backgroundColor: colors.primaryDeep,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: {
    fontSize: typography.caption,
    lineHeight: typography.caption * 1.5,
    color: colors.accent,
    textAlign: 'center',
  },
  dismissButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
