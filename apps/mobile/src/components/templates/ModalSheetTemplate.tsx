import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { mobileTheme } from '../../design/tokenAdapter';
import { overlays } from '../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

const HANDLE_HEIGHT = spacing.xs;
const HANDLE_WIDTH = spacing['3xl'];

export interface ModalSheetTemplateProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    snapPoints?: (string | number)[];
    testID?: string;
}

export function ModalSheetTemplate({
    isOpen,
    onClose,
    title,
    children,
    snapPoints = ['50%', '70%'],
    testID,
}: ModalSheetTemplateProps) {
    const bottomSheetRef = useRef<BottomSheet>(null);

    useEffect(() => {
        if (isOpen) {
            bottomSheetRef.current?.snapToIndex(0);
        } else {
            bottomSheetRef.current?.close();
        }
    }, [isOpen]);

    const handleSheetChanges = useCallback(
        (index: number) => {
            if (index === -1) {
                onClose();
            }
        },
        [onClose],
    );

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                style={[props.style, { backgroundColor: overlays.sheet }]}
                pressBehavior="close"
            />
        ),
        [],
    );

    return (
        <View testID={testID}>
            <BottomSheet
                ref={bottomSheetRef}
                index={isOpen ? 0 : -1}
                snapPoints={snapPoints}
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetView style={styles.contentContainer}>
                    {title && (
                        <Text style={styles.title}>{title}</Text>
                    )}
                    <View style={styles.content}>
                        {children}
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.card,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
    },
    handleIndicator: {
        backgroundColor: colors.chipInactive,
        width: HANDLE_WIDTH,
        height: HANDLE_HEIGHT,
        borderRadius: radius.full,
    },
    contentContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    title: {
        fontSize: typography.title,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: spacing.lg,
    },
    content: {
        gap: spacing.md,
    },
});
