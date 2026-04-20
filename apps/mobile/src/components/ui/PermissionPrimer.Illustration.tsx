import React from 'react';
import { Text, View } from 'react-native';

import { elevations } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';
import { mobileSurfaces } from '../../design/surfaces';

const { colors } = mobileTheme;
const { permissionPrimer } = mobileSurfaces;

interface IllustrationAreaProps {
  icon: React.ReactNode;
}

export function IllustrationArea({ icon }: IllustrationAreaProps) {
  return (
    <View
      className="absolute left-0 right-0 top-0 bottom-[40%] items-center justify-center"
      pointerEvents="none"
    >
      <View
        className="rounded-full items-center justify-center"
        style={{
          width: permissionPrimer.topIllustrationSize,
          height: permissionPrimer.topIllustrationSize,
          backgroundColor: colors.card,
          ...elevations.elevated,
        }}
      >
        {icon}
      </View>
    </View>
  );
}

interface IconPreviewProps {
  icon: React.ReactNode;
  badgeLabel: string;
}

export function IconPreview({ icon, badgeLabel }: IconPreviewProps) {
  return (
    <View className="mt-sm mb-lg items-center">
      <View
        className="rounded-md items-center justify-center bg-muted"
        style={{
          width: permissionPrimer.iconPreviewSize,
          height: permissionPrimer.iconPreviewSize,
        }}
      >
        {icon}
      </View>
      <View
        className="absolute rounded-md items-center justify-center bg-accent border-background"
        style={[
          elevations.card,
          {
            top: permissionPrimer.badgeOffset,
            right: permissionPrimer.badgeOffset,
            width: permissionPrimer.badgeSize,
            height: permissionPrimer.badgeSize,
            borderWidth: permissionPrimer.badgeBorder,
          },
        ]}
      >
        <Text style={{ color: colors.primaryDeep, fontSize: 14, fontWeight: '700' }}>
          {badgeLabel}
        </Text>
      </View>
    </View>
  );
}
