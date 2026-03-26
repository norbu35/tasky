import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';

const { colors, radius } = mobileTheme;

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 128,
};

interface ProfileAvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  showVerified?: boolean;
}

export function ProfileAvatar({
  uri,
  name,
  size = 'md',
  showVerified = false,
}: ProfileAvatarProps) {
  const dim = sizeMap[size];
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';
  const badgeSize = Math.max(20, dim * 0.22);

  return (
    <View style={{ width: dim, height: dim }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: dim, height: dim, borderRadius: size === 'xl' ? radius.full : radius.md },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: dim, height: dim, borderRadius: size === 'xl' ? radius.full : radius.md },
          ]}
        >
          <Text style={[styles.fallbackText, { fontSize: dim * 0.35 }]}>{initials}</Text>
        </View>
      )}
      {showVerified && (
        <View
          style={[
            styles.badge,
            { width: badgeSize + 8, height: badgeSize + 8, borderRadius: radius.full },
          ]}
        >
          <View
            style={[
              styles.badgeInner,
              { width: badgeSize, height: badgeSize, borderRadius: radius.full },
            ]}
          >
            <CheckCircle
              size={badgeSize * 0.7}
              color={colors.verifiedForeground}
              fill={colors.verified}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.subtleViolet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevations.card,
  },
  badgeInner: {
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
