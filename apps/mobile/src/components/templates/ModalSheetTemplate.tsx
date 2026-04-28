import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { elevations, overlays } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors, spacing, radius } = mobileTheme;

const HANDLE_HEIGHT = 4;
const HANDLE_WIDTH = 40;
const SHEET_CONTAINER_STYLE = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
};

interface SheetAction {
  label: string;
  onPress: () => void;
  testID?: string;
}

export interface ModalSheetTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleAlign?: 'left' | 'center';
  children?: React.ReactNode;
  snapPoints?: (string | number)[];
  testID?: string;
  className?: string;
  contentClassName?: string;
  dismissible?: boolean;
  isLoading?: boolean;
  loadingTestID?: string;
  primaryAction?: SheetAction;
  secondaryAction?: SheetAction;
  hideDefaultAction?: boolean;
  footer?: React.ReactNode;
  headerLeading?: React.ReactNode;
  headerTrailing?: React.ReactNode;
}

export function ModalSheetTemplate({
  isOpen,
  onClose,
  title,
  titleAlign = 'left',
  children,
  snapPoints = ['50%', '70%'],
  testID,
  className,
  contentClassName,
  dismissible = true,
  isLoading = false,
  loadingTestID,
  primaryAction,
  secondaryAction,
  hideDefaultAction = false,
  footer,
  headerLeading,
  headerTrailing,
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
        pressBehavior={dismissible ? 'close' : 'none'}
      />
    ),
    [dismissible],
  );

  const renderActions = () => {
    if (footer) return footer;
    if (primaryAction || secondaryAction) {
      return (
        <View className="gap-sm">
          {primaryAction && (
            <Button
              label={primaryAction.label}
              onPress={primaryAction.onPress}
              testID={primaryAction.testID}
            />
          )}
          {secondaryAction && (
            <Button
              label={secondaryAction.label}
              variant="secondary"
              onPress={secondaryAction.onPress}
              testID={secondaryAction.testID}
            />
          )}
        </View>
      );
    }
    if (!hideDefaultAction) {
      return null;
    }
    return null;
  };

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
        enablePanDownToClose={dismissible}
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
          {(title || headerLeading || headerTrailing) && (
            <View className="flex-row items-center mb-md">
              {headerLeading && <View className="w-9 items-start">{headerLeading}</View>}
              {titleAlign === 'center' && !headerLeading && headerTrailing && (
                <View className="w-9" />
              )}
              {title && (
                <Text
                  className={cn(
                    'text-body font-sans-bold text-foreground',
                    titleAlign === 'center' && 'flex-1 text-center',
                  )}
                >
                  {title}
                </Text>
              )}
              {headerTrailing && <View className="w-9 items-end">{headerTrailing}</View>}
              {headerLeading && titleAlign === 'center' && !headerTrailing && (
                <View className="w-9" />
              )}
            </View>
          )}
          {isLoading ? (
            <View className="py-xl items-center justify-center" testID={loadingTestID}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View className={cn('gap-md', contentClassName)}>{children}</View>
          )}
          {!isLoading && renderActions()}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
