import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';

const { tint } = mobileSurfaces;

interface ApplicantsSectionProps {
  hasApplicants: boolean;
  applicantCount: number;
  t: (k: string) => string;
}

export function ApplicantsSection({ hasApplicants, applicantCount, t }: ApplicantsSectionProps) {
  return (
    <View className="bg-muted rounded-sm p-lg gap-sm">
      <View className="flex-row justify-between items-center">
        <Text className="text-subtitle font-extrabold text-foreground">
          {t('TaskDetailCustomerScreen.applicants')}
        </Text>
        <Text
          className="text-caption font-extrabold text-center text-primary-deep"
          style={{
            minWidth: mobileSurfaces.taskDetail.pillMinWidth,
            paddingHorizontal: mobileSurfaces.taskDetail.pillInsetX,
            paddingVertical: mobileSurfaces.taskDetail.pillInsetY,
            borderRadius: 9999,
            backgroundColor: tint.primarySoft,
          }}
        >
          {applicantCount}
        </Text>
      </View>
      {hasApplicants ? (
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('TaskDetailCustomerScreen.applicationsReceived')}
        </Text>
      ) : (
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('TaskDetailCustomerScreen.noApplicants')}
        </Text>
      )}
    </View>
  );
}
