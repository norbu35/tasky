import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevations, overlays } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors, spacing, radius } = mobileTheme;

const HANDLE_HEIGHT = spacing.xs;
const HANDLE_WIDTH = spacing['3xl'];
const SHEET_CONTAINER_STYLE = [
  StyleSheet.absoluteFillObject,
  {
    zIndex: 1000,
    elevation: 1000,
  },
];

export interface ModalSheetTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  testID?: string;
  className?: string;
}

export function ModalSheetTemplate({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = ['50%', '70%'],
  testID,
  className,
}: ModalSheetTemplateProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

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
    <View
      testID={testID}
      pointerEvents={isOpen ? 'auto' : 'none'}
      className={cn(className)}
      style={SHEET_CONTAINER_STYLE}
    >
      <BottomSheet
        ref={bottomSheetRef}
        index={isOpen ? 0 : -1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: colors.card,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          ...elevations.elevated,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
          width: HANDLE_WIDTH,
          height: HANDLE_HEIGHT,
          borderRadius: radius.full,
        }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}
        >
          {title && (
            <Text className="text-title font-display-bold text-foreground mb-lg">{title}</Text>
          )}
          <View className="gap-md">{children}</View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
