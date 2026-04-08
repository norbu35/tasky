import React from 'react';
import { Image, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { cn } from '../../lib/cn';

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
  className?: string;
}

export function ProfileAvatar({
  uri,
  name,
  size = 'md',
  showVerified = false,
  className,
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
  const borderRadius = size === 'xl' ? radius.full : radius.md;

  return (
    <View style={{ width: dim, height: dim }} className={cn(className)}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius, overflow: 'hidden' }}
        />
      ) : (
        <View
          style={{ width: dim, height: dim, borderRadius }}
          className="bg-subtleViolet items-center justify-center"
        >
          <Text style={{ fontSize: dim * 0.35 }} className="font-sans-bold text-primaryDeep">
            {initials}
          </Text>
        </View>
      )}
      {showVerified && (
        <View
          style={[
            { width: badgeSize + 8, height: badgeSize + 8, borderRadius: radius.full },
            elevations.card,
          ]}
          className="absolute -bottom-[2px] -right-[2px] bg-card items-center justify-center"
        >
          <View
            style={{ width: badgeSize, height: badgeSize, borderRadius: radius.full }}
            className="bg-verified items-center justify-center"
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
