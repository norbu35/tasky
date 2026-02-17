import type {ReactNode} from "react";
import {Modal, Pressable, StyleSheet, Text, View} from "react-native";
import {mobileTheme} from "../../design/tokenAdapter";
import {Button} from "./Button";

type Props = {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
};

export function ModalSheet({visible, title, onClose, children}: Props) {
    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable
                    accessibilityRole="button"
                    onPress={onClose}
                    style={StyleSheet.absoluteFill}
                    testID="modal-sheet-backdrop"
                />
                <View style={styles.sheet}>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.content}>{children}</View>
                    <Button label="Close" variant="secondary" onPress={onClose}/>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(16, 24, 34, 0.38)"
    },
    sheet: {
        backgroundColor: mobileTheme.colors.card,
        borderTopLeftRadius: mobileTheme.radius.lg,
        borderTopRightRadius: mobileTheme.radius.lg,
        paddingHorizontal: mobileTheme.spacing.lg,
        paddingVertical: mobileTheme.spacing.xl,
        gap: mobileTheme.spacing.md
    },
    title: {
        fontSize: mobileTheme.typography.body,
        fontWeight: "700",
        color: mobileTheme.colors.foreground
    },
    content: {
        gap: mobileTheme.spacing.sm
    }
});
