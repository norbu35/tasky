import { Banknote, CalendarDays, Headphones, Sparkles } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

const { colors } = mobileTheme;

export interface NoApplicantRescueProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onAdjustBudget: () => void;
  onAdjustSchedule: () => void;
  onRequestConcierge: () => void;
}

function RescueButton({
  icon: Icon,
  label,
  description,
  onPress,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-md bg-muted rounded-md p-md"
      accessibilityRole="button"
    >
      <View className="w-[36] h-[36] rounded-md bg-card items-center justify-center">
        <Icon size={20} color={colors.secondary} />
      </View>
      <View className="flex-1 gap-[2]">
        <Text className="text-body font-bold text-primary-deep">{label}</Text>
        <Text className="text-caption text-text-secondary leading-normal">{description}</Text>
      </View>
    </Pressable>
  );
}

export function NoApplicantRescue({
  isOpen,
  onClose,
  taskId: _taskId,
  onAdjustBudget,
  onAdjustSchedule,
  onRequestConcierge,
}: NoApplicantRescueProps) {
  const { t } = useTranslation();

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      testID="no-applicant-rescue"
      snapPoints={['86%']}
    >
      <View className="items-center mt-sm mb-md">
        <View className="w-[64] h-[64] rounded-lg bg-muted items-center justify-center">
          <Sparkles size={24} color={colors.secondary} />
        </View>
      </View>

      <Text className="text-subtitle font-bold text-primary-deep text-center">
        {t('customer.noApplicantRescue.title')}
      </Text>

      <Text className="text-body text-text-secondary text-center mt-sm leading-relaxed">
        {t('NoApplicantRescue.copy1')}
      </Text>

      <View className="gap-sm mt-sm">
        <RescueButton
          icon={Banknote}
          label={t('customer.noApplicantRescue.adjustBudget')}
          description={t('NoApplicantRescue.copy2')}
          onPress={onAdjustBudget}
        />

        <RescueButton
          icon={CalendarDays}
          label={t('customer.noApplicantRescue.adjustSchedule')}
          description={t('NoApplicantRescue.copy3')}
          onPress={onAdjustSchedule}
        />

        <RescueButton
          icon={Headphones}
          label={t('customer.noApplicantRescue.requestConcierge')}
          description={t('NoApplicantRescue.copy4')}
          onPress={onRequestConcierge}
        />
      </View>

      <View className="bg-primary-deep rounded-md p-md">
        <Text className="text-caption text-accent text-center leading-normal">
          {t('NoApplicantRescue.copy5')}
        </Text>
      </View>

      <Pressable
        onPress={onClose}
        className="items-center justify-center"
        style={{ minHeight: mobileSurfaces.touchTarget.ctaHeight }}
        accessibilityRole="button"
      >
        <Text className="text-body font-bold text-text-secondary">
          {t('customer.noApplicantRescue.dismiss')}
        </Text>
      </Pressable>
    </ModalSheetTemplate>
  );
}
