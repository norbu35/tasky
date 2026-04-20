import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';

const { colors, radius } = mobileTheme;

const ERROR_VISUAL = {
  canvas: 132,
  halo: 108,
  haloOpacity: 0.55,
  ring: 92,
  ringBorderWidth: 2,
  bubblePrimary: {
    width: 58,
    height: 40,
    radius: 18,
    left: 8,
    top: 18,
    tailSize: 10,
    tailLeft: 12,
    tailBottom: -5,
  },
  bubbleSecondary: {
    width: 44,
    height: 30,
    radius: 14,
    right: 10,
    bottom: 14,
    tailSize: 8,
    tailRight: 10,
    tailBottom: -4,
  },
  marker: {
    size: 28,
  },
} as const;

export function HelpErrorVisual() {
  return (
    <View
      className="items-center justify-center mb-lg"
      style={{ width: ERROR_VISUAL.canvas, height: ERROR_VISUAL.canvas }}
      accessibilityRole="image"
    >
      <View
        style={{
          position: 'absolute',
          width: ERROR_VISUAL.halo,
          height: ERROR_VISUAL.halo,
          borderRadius: radius.full,
          backgroundColor: colors.muted,
          opacity: ERROR_VISUAL.haloOpacity,
        }}
      />
      <View
        style={{
          width: ERROR_VISUAL.ring,
          height: ERROR_VISUAL.ring,
          borderRadius: radius.full,
          borderWidth: ERROR_VISUAL.ringBorderWidth,
          borderColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: ERROR_VISUAL.bubblePrimary.width,
            height: ERROR_VISUAL.bubblePrimary.height,
            borderRadius: ERROR_VISUAL.bubblePrimary.radius,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            position: 'absolute',
            left: ERROR_VISUAL.bubblePrimary.left,
            top: ERROR_VISUAL.bubblePrimary.top,
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: ERROR_VISUAL.bubblePrimary.tailLeft,
              bottom: ERROR_VISUAL.bubblePrimary.tailBottom,
              width: ERROR_VISUAL.bubblePrimary.tailSize,
              height: ERROR_VISUAL.bubblePrimary.tailSize,
              backgroundColor: colors.card,
              borderLeftWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.border,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
        <View
          style={{
            width: ERROR_VISUAL.bubbleSecondary.width,
            height: ERROR_VISUAL.bubbleSecondary.height,
            borderRadius: ERROR_VISUAL.bubbleSecondary.radius,
            backgroundColor: colors.primary,
            position: 'absolute',
            right: ERROR_VISUAL.bubbleSecondary.right,
            bottom: ERROR_VISUAL.bubbleSecondary.bottom,
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: ERROR_VISUAL.bubbleSecondary.tailRight,
              bottom: ERROR_VISUAL.bubbleSecondary.tailBottom,
              width: ERROR_VISUAL.bubbleSecondary.tailSize,
              height: ERROR_VISUAL.bubbleSecondary.tailSize,
              backgroundColor: colors.primary,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
        <View
          style={{
            width: ERROR_VISUAL.marker.size,
            height: ERROR_VISUAL.marker.size,
            borderRadius: radius.full,
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="text-caption font-sans-bold" style={{ color: colors.dangerForeground }}>
            ?
          </Text>
        </View>
      </View>
    </View>
  );
}
