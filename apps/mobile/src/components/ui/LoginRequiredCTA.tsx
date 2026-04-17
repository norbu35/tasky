import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';

import { mobileTheme } from '../../design/tokenAdapter';
import { mobileSurfaces } from '../../design/surfaces';
import { cn } from '../../lib/cn';

import { Button } from './Button';
import { Reveal } from './Reveal';

const { tint } = mobileSurfaces;

interface LoginRequiredCTAProps {
  message?: string;
  testID?: string;
  className?: string;
}

export function LoginRequiredCTA({ message, testID, className }: LoginRequiredCTAProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View
      className={cn('flex-1 justify-center items-center p-6 bg-background', className)}
      testID={testID}
    >
      <Reveal delay={20}>
        <View
          className="w-[100px] h-[100px] rounded-full justify-center items-center mb-6"
          style={{ backgroundColor: tint.primaryStrong }}
        >
          <Lock color={mobileTheme.colors.primary} size={48} />
        </View>
      </Reveal>
      <Reveal delay={60}>
        <Text className="text-[24px] font-bold text-foreground mb-3 text-center">
          {t('auth.loginRequired') || t('LoginRequiredCTA.copy1')}
        </Text>
      </Reveal>
      <Reveal delay={100}>
        <Text
          className="text-body text-muted-foreground text-center mb-8"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {message || t('auth.loginReason') || t('LoginRequiredCTA.copy2')}
        </Text>
      </Reveal>
      <Reveal delay={140} className="self-stretch">
        <Button
          label={t('auth.loginButton') || t('LoginRequiredCTA.copy3')}
          onPress={() => router.push('/(auth)')}
          style={{ alignSelf: 'stretch', maxWidth: 300 }}
        />
      </Reveal>
    </View>
  );
}
