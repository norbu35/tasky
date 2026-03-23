import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { overlays } from '../../design/elevations';
import { Button } from './Button';

const { colors, radius, spacing, typography } = mobileTheme;

interface ConfirmSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    testID?: string;
}

export function ConfirmSheet({
    isOpen,
    onClose,
    title,
    description,
    confirmLabel,
    onConfirm,
    isDestructive = false,
    testID,
}: ConfirmSheetProps) {
    const { t } = useTranslation();

    return (
        <Modal
            animationType="slide"
            transparent
            visible={isOpen}
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <Pressable
                    accessibilityRole="button"
                    onPress={onClose}
                    style={StyleSheet.absoluteFill}
                    testID="confirm-sheet-backdrop"
                />
                <View style={styles.sheet} testID={testID}>
                    {isDestructive && (
                        <View style={styles.iconContainer}>
                            <AlertTriangle size={32} color={colors.danger} />
                        </View>
                    )}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                    <View style={styles.actions}>
                        <Button
                            label={confirmLabel}
                            variant={isDestructive ? 'destructive' : 'default'}
                            onPress={() => {
                                onConfirm();
                                onClose();
                            }}
                            style={styles.button}
                            accessibilityLabel={confirmLabel}
                        />
                        <Button
                            label={t('common.cancel')}
                            variant="ghost"
                            onPress={onClose}
                            style={styles.button}
                            accessibilityLabel={t('common.cancel')}
                        />
                    </View>
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
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.title,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    description: {
        fontSize: typography.body,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    actions: {
        width: '100%',
        gap: spacing.sm,
    },
    button: {
        width: '100%',
    },
});
