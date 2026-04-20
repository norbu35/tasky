import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';

const { colors, radius, spacing } = mobileTheme;

const ERROR_DOCUMENT_SURFACE = {
  width: 88,
  height: 108,
  foldSize: 28,
  exclamationSize: 28,
  markerRadius: 14,
  innerPadding: 12,
  rowHeight: 8,
  rowGap: 8,
} as const;

export function TermsErrorVisual() {
  return (
    <View
      className="w-[128px] h-[128px] items-center justify-center mb-lg"
      accessibilityRole="image"
    >
      <View
        style={{
          width: ERROR_DOCUMENT_SURFACE.width,
          height: ERROR_DOCUMENT_SURFACE.height,
          borderRadius: radius.lg,
          backgroundColor: colors.muted,
          padding: ERROR_DOCUMENT_SURFACE.innerPadding,
          gap: ERROR_DOCUMENT_SURFACE.rowGap,
          position: 'relative',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: ERROR_DOCUMENT_SURFACE.foldSize,
            height: ERROR_DOCUMENT_SURFACE.foldSize,
            backgroundColor: colors.border,
            borderTopRightRadius: radius.lg,
            borderBottomLeftRadius: radius.md,
          }}
        />
        <View
          style={{
            height: ERROR_DOCUMENT_SURFACE.rowHeight,
            width: '60%',
            borderRadius: radius.xs,
            backgroundColor: colors.border,
            marginTop: spacing.lg,
          }}
        />
        <View
          style={{
            height: ERROR_DOCUMENT_SURFACE.rowHeight,
            alignSelf: 'stretch',
            borderRadius: radius.xs,
            backgroundColor: colors.border,
          }}
        />
        <View
          style={{
            height: ERROR_DOCUMENT_SURFACE.rowHeight,
            alignSelf: 'stretch',
            borderRadius: radius.xs,
            backgroundColor: colors.border,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 6,
          right: 6,
          width: ERROR_DOCUMENT_SURFACE.exclamationSize,
          height: ERROR_DOCUMENT_SURFACE.exclamationSize,
          borderRadius: ERROR_DOCUMENT_SURFACE.markerRadius,
          backgroundColor: colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text className="text-caption font-sans-bold" style={{ color: colors.dangerForeground }}>
          !
        </Text>
      </View>
    </View>
  );
}
