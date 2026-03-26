import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    testID?: string;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
    testID?: string;
  };
  dismissible?: boolean;
};

export function ModalSheet({
  visible,
  title,
  onClose,
  children,
  primaryAction,
  secondaryAction,
  dismissible = true,
}: Props) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {dismissible ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
            testID="modal-sheet-backdrop"
          />
        ) : (
          <View style={StyleSheet.absoluteFill} pointerEvents="none" />
        )}
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <View style={styles.content}>{children}</View>
          {primaryAction || secondaryAction ? (
            <View style={styles.actions}>
              {primaryAction ? (
                <Button
                  label={primaryAction.label}
                  onPress={primaryAction.onPress}
                  testID={primaryAction.testID}
                />
              ) : null}
              {secondaryAction ? (
                <Button
                  label={secondaryAction.label}
                  variant="secondary"
                  onPress={secondaryAction.onPress}
                  testID={secondaryAction.testID}
                />
              ) : null}
            </View>
          ) : (
            <Button label="Close" variant="secondary" onPress={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 24, 34, 0.38)',
  },
  sheet: {
    backgroundColor: mobileTheme.colors.card,
    borderTopLeftRadius: mobileTheme.radius.lg,
    borderTopRightRadius: mobileTheme.radius.lg,
    paddingHorizontal: mobileTheme.spacing.lg,
    paddingVertical: mobileTheme.spacing.xl,
    gap: mobileTheme.spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: mobileTheme.radius.full,
    backgroundColor: '#D7D5D1',
  },
  title: {
    fontSize: mobileTheme.typography.body,
    fontWeight: '700',
    color: mobileTheme.colors.foreground,
  },
  content: {
    gap: mobileTheme.spacing.sm,
  },
  actions: {
    gap: mobileTheme.spacing.sm,
  },
});
