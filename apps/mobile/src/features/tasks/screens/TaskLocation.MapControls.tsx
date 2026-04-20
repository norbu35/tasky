import { LocateFixed, Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

const { colors } = mobileTheme;

interface MapControlsProps {
  locating: boolean;
  onLocate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function MapControls({ locating, onLocate, onZoomIn, onZoomOut }: MapControlsProps) {
  const btnStyle = {
    width: mobileSurfaces.iconButton.md,
    height: mobileSurfaces.iconButton.md,
  };

  return (
    <View className="absolute right-3 bottom-3 gap-sm">
      <Touchable
        className="rounded-sm items-center justify-center bg-card border border-border"
        style={btnStyle}
        accessibilityRole="button"
        testID="location-locate-button"
        onPress={onLocate}
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.primaryDeep} />
        ) : (
          <LocateFixed size={20} color={colors.primaryDeep} />
        )}
      </Touchable>
      <Touchable
        className="rounded-sm items-center justify-center bg-card border border-border"
        style={btnStyle}
        accessibilityRole="button"
        testID="location-zoom-in-button"
        onPress={onZoomIn}
      >
        <Plus size={20} color={colors.primaryDeep} />
      </Touchable>
      <Touchable
        className="rounded-sm items-center justify-center bg-card border border-border"
        style={btnStyle}
        accessibilityRole="button"
        testID="location-zoom-out-button"
        onPress={onZoomOut}
      >
        <Minus size={20} color={colors.primaryDeep} />
      </Touchable>
    </View>
  );
}
