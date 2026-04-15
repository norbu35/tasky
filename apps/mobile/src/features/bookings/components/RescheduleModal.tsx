import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '../../../components/ui';
import { mobileTheme, overlays } from '../../../design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  currentDate: string;
  currentTime: string;
  onSubmit: (data: { date: string; time: string; reason?: string }) => void;
}

export function RescheduleModal({
  visible,
  onClose,
  currentDate,
  currentTime,
  onSubmit,
}: RescheduleModalProps) {
  const { t } = useTranslation();
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  const canSubmit = newDate.trim().length > 0 && newTime.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      date: newDate.trim(),
      time: newTime.trim(),
      reason: reason.trim() || undefined,
    });
  };

  const handleClose = () => {
    setNewDate('');
    setNewTime('');
    setReason('');
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
          testID="reschedule-backdrop"
        />
        <View style={styles.sheet}>
          {/* Title */}
          <Text style={styles.title}>{t('reschedule.title')}</Text>

          {/* Current Schedule */}
          <View style={styles.currentSchedule}>
            <Text style={styles.currentLabel}>{t('reschedule.currentSchedule')}</Text>
            <View style={styles.currentRow}>
              <Text style={styles.currentValue}>{currentDate}</Text>
              <Text style={styles.currentSeparator}>|</Text>
              <Text style={styles.currentValue}>{currentTime}</Text>
            </View>
          </View>

          {/* Date Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('reschedule.newDate')}</Text>
            <Input
              placeholder={t('reschedule.datePlaceholder')}
              value={newDate}
              onChangeText={setNewDate}
            />
          </View>

          {/* Time Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('reschedule.newTime')}</Text>
            <Input
              placeholder={t('reschedule.timePlaceholder')}
              value={newTime}
              onChangeText={setNewTime}
            />
          </View>

          {/* Reason Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t('reschedule.reason')}{' '}
              <Text style={styles.optionalTag}>({t('common.optional')})</Text>
            </Text>
            <Input
              placeholder={t('reschedule.reasonPlaceholder')}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              style={styles.reasonInput}
            />
          </View>

          {/* Actions */}
          <Button
            label={t('reschedule.submit')}
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={styles.submitButton}
          />

          <Pressable onPress={handleClose} style={styles.cancelLink}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: overlays.sheet,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.lg,
  },
  currentSchedule: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  currentLabel: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currentValue: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.foreground,
  },
  currentSeparator: {
    fontSize: typography.label,
    color: colors.mutedForeground,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.label,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  optionalTag: {
    fontWeight: '400',
    color: colors.mutedForeground,
  },
  reasonInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: typography.label,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
});
