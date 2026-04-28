import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import { Reveal } from './Reveal';

const { colors, iconSizes } = mobileTheme;
const { tint } = mobileSurfaces;

interface TrustBannerProps {
  title: string;
  description: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export function TrustBanner({
  title,
  description,
  variant = 'default',
  className,
}: TrustBannerProps) {
  const isCompact = variant === 'compact';
  return (
    <Reveal delay={90}>
      <View
        style={
          isCompact
            ? { backgroundColor: colors.trust }
            : { backgroundColor: tint.trustSoft, borderColor: colors.trust, borderWidth: 1 }
        }
        className={cn('flex-row items-center gap-md p-lg rounded-md', className)}
      >
        <View
          style={
            isCompact ? { backgroundColor: tint.primarySubtle } : { backgroundColor: colors.trust }
          }
          className={cn(
            'items-center justify-center',
            isCompact ? 'w-10 h-10 rounded-full' : 'w-9 h-10 rounded-sm',
          )}
        >
          <ShieldCheck size={isCompact ? iconSizes.xs : iconSizes.sm} color={colors.trustMuted} />
        </View>
        <View className="flex-1">
          <Text className="text-label font-sans-bold text-foreground" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-label text-foreground">{description}</Text>
        </View>
      </View>
    </Reveal>
  );
}
