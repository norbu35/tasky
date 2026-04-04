import { useTranslation } from 'react-i18next';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../../design/tokenAdapter';
import { overlays } from '../../design/elevations';

const { colors, radius, spacing, typography } = mobileTheme;

interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ActionSheetAction[];
  testID?: string;
}

export function ActionSheet({ isOpen, onClose, actions, testID }: ActionSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={isOpen} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="action-sheet-backdrop"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} testID={testID}>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              style={[styles.actionRow, index < actions.length - 1 && styles.actionBorder]}
              onPress={() => {
                action.onPress();
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              {action.icon && <View style={styles.iconContainer}>{action.icon}</View>}
              <Text style={[styles.actionText, action.destructive && styles.destructiveText]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancelRow} onPress={onClose} accessibilityRole="button">
            <Text style={styles.cancelText}>{t('common.cancel', 'Cancel')}</Text>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  actionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  actionText: {
    fontSize: typography.body,
    color: colors.foreground,
  },
  destructiveText: {
    color: colors.danger,
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cancelText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
