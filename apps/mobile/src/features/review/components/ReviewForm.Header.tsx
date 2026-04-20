import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';

import { colors, typography } from './ReviewForm.model';

export function ReviewFormHeader({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <View
      className="flex-row items-center gap-md px-screen-x py-lg bg-background"
      testID="review-form-header"
    >
      <Touchable
        testID="review-form-close"
        onPress={onClose}
        className="w-12 h-12 rounded-full items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
      >
        <ArrowLeft size={20} color={colors.primaryDeep} />
      </Touchable>
      <Text
        className="flex-1 text-title font-sans-bold text-primary-deep"
        style={{ lineHeight: Math.round(typography.title * 1.4), letterSpacing: -0.5 }}
      >
        {t('shared.review.navTitle')}
      </Text>
    </View>
  );
}

export function CounterpartyCard({
  name,
  role,
  avatarUrl,
}: {
  name: string;
  role: string;
  avatarUrl: string;
}) {
  return (
    <View className="flex-row items-center gap-xl">
      <ProfileAvatar uri={avatarUrl} name={name} size="lg" showVerified={true} />
      <View className="flex-1 gap-xs">
        <Text className="text-subtitle font-sans-bold text-primary-deep">{name}</Text>
        <Text
          className="self-start rounded-full px-md py-[2px] text-caption font-sans-bold text-text-secondary"
          style={{ backgroundColor: colors.statusOpen }}
        >
          {role}
        </Text>
      </View>
    </View>
  );
}
