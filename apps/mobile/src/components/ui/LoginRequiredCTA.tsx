import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from './Button';
import { mobileTheme } from '../../design/tokenAdapter';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react-native';
import { cn } from '../../lib/cn';

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
      <View
        className="w-[100px] h-[100px] rounded-full justify-center items-center mb-6"
        style={{ backgroundColor: mobileTheme.colors.primary + '15' }}
      >
        <Lock color={mobileTheme.colors.primary} size={48} />
      </View>
      <Text className="text-[24px] font-bold text-foreground mb-3 text-center">
        {t('auth.loginRequired') || t('LoginRequiredCTA.copy1')}
      </Text>
      <Text className="text-body text-muted-foreground text-center mb-8" style={{ lineHeight: 24 }}>
        {message || t('auth.loginReason') || t('LoginRequiredCTA.copy2')}
      </Text>
      <Button
        label={t('auth.loginButton') || t('LoginRequiredCTA.copy3')}
        onPress={() => router.push('/(auth)')}
        style={{ alignSelf: 'stretch', maxWidth: 300 }}
      />
    </View>
  );
}
