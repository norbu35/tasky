import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';
import { cn } from '@/lib/cn';

import { Reveal } from './Reveal';

const { colors, iconSizes, typographyVariants } = mobileTheme;
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
        className={cn('flex-row items-center gap-[16px] p-[17px] rounded-md', className)}
      >
        <View
          style={
            isCompact ? { backgroundColor: tint.primarySubtle } : { backgroundColor: colors.trust }
          }
          className={cn(
            'items-center justify-center',
            isCompact ? 'w-[40px] h-[40px] rounded-full' : 'w-[37px] h-[40px] rounded-sm',
          )}
        >
          <ShieldCheck size={isCompact ? iconSizes.xs : iconSizes.sm} color={colors.trustMuted} />
        </View>
        <View className="flex-1">
          <Text
            className="text-caption font-sans-bold text-trust-muted uppercase"
            style={{ letterSpacing: typographyVariants.badgeText.letterSpacing }}
          >
            {title}
          </Text>
          <Text className="text-label text-foreground leading-[20px]">{description}</Text>
        </View>
      </View>
    </Reveal>
  );
}
