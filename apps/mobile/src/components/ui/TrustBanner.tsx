import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces, mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

import { Reveal } from './Reveal';

const { colors } = mobileTheme;
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
    <Reveal
      delay={90}
      style={
        isCompact
          ? { backgroundColor: colors.trust }
          : { backgroundColor: tint.trustSoft, borderColor: colors.trust }
      }
      className={cn(
        'flex-row items-center gap-[16px] p-[17px] rounded-md',
        !isCompact && 'border',
        className,
      )}
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
        <ShieldCheck size={isCompact ? 16 : 20} color={colors.trustMuted} />
      </View>
      <View className="flex-1">
        <Text className="text-caption font-sans-bold text-trust-muted uppercase tracking-[0.6px]">
          {title}
        </Text>
        <Text className="text-label text-trust-foreground leading-[20px]">{description}</Text>
      </View>
    </Reveal>
  );
}
