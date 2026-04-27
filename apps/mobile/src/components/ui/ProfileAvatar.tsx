import { CheckCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors, iconSizes, radius } = mobileTheme;

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
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
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const dim = sizeMap[size];
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';
  const badgeSize = Math.max(iconSizes.semantic.avatarBadge, dim * 0.22);
  const borderRadius = size === 'xl' ? radius.full : radius.md;
  const shouldRenderImage = !!uri && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(false);
  }, [uri]);

  return (
    <View style={{ width: dim, height: dim }} className={cn(className)}>
      <View
        style={{ width: dim, height: dim, borderRadius }}
        className="bg-muted items-center justify-center"
      >
        <Text style={{ fontSize: dim * 0.35 }} className="font-sans-bold text-primary-deep">
          {initials}
        </Text>
      </View>
      {shouldRenderImage ? (
        <Image
          testID="profile-avatar-image"
          source={{ uri }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: dim,
            height: dim,
            borderRadius,
            overflow: 'hidden',
            opacity: imageLoaded ? 1 : 0,
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
        />
      ) : null}
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
