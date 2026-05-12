import React from 'react';
import { Text, View } from 'react-native';

import { nativeTokens } from '@tasky/design-tokens';

import { elevations } from '@/design/elevations';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;
const { permissionPrimer } = mobileSurfaces;
const colorOpacity = nativeTokens.colorOpacity;

interface PermissionIllustrationProps {
  icon: React.ReactNode;
  badgeLabel: string;
}

export function PermissionIllustration({ icon, badgeLabel }: PermissionIllustrationProps) {
  return (
    <View className="items-center justify-center mb-xl">
      {/* Outer decorative ring */}
      <View
        className="rounded-full items-center justify-center"
        style={{
          width: permissionPrimer.outerRingSize,
          height: permissionPrimer.outerRingSize,
          backgroundColor: colorOpacity.primary[5],
        }}
      >
        {/* Middle decorative ring */}
        <View
          className="rounded-full items-center justify-center"
          style={{
            width: permissionPrimer.middleRingSize,
            height: permissionPrimer.middleRingSize,
            backgroundColor: colorOpacity.primary[15],
          }}
        >
          {/* Inner icon container */}
          <View
            className="rounded-full items-center justify-center"
            style={[
              {
                width: permissionPrimer.innerIconSize,
                height: permissionPrimer.innerIconSize,
                backgroundColor: colors.card,
              },
              elevations.card,
            ]}
          >
            {icon}
          </View>
        </View>
      </View>

      {/* Badge */}
      <View
        className="absolute rounded-full items-center justify-center"
        style={[
          elevations.card,
          {
            bottom:
              permissionPrimer.outerRingSize / 2 -
              permissionPrimer.innerIconSize / 2 +
              permissionPrimer.badgeOffset,
            right:
              permissionPrimer.outerRingSize / 2 -
              permissionPrimer.innerIconSize / 2 +
              permissionPrimer.badgeOffset,
            width: permissionPrimer.badgeSize,
            height: permissionPrimer.badgeSize,
            backgroundColor: colors.accent,
            borderWidth: permissionPrimer.badgeBorder,
            borderColor: colors.background,
          },
        ]}
      >
        <Text className="text-label font-sans-bold text-primary-deep">{badgeLabel}</Text>
      </View>
    </View>
  );
}
