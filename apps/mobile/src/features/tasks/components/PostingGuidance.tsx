import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors } = mobileTheme;

type PostingGuidanceCardProps = {
  titleKey: string;
  bodyKey: string;
  testID?: string;
  className?: string;
};

export function PostingGuidanceCard({
  titleKey,
  bodyKey,
  testID,
  className,
}: PostingGuidanceCardProps) {
  const { t } = useTranslation();

  return (
    <View testID={testID} className={cn('rounded-md bg-muted p-md gap-xs', className)}>
      <Text className="text-label font-sans-bold text-primary-deep">{t(titleKey)}</Text>
      <Text className="text-caption text-text-secondary leading-relaxed">{t(bodyKey)}</Text>
    </View>
  );
}

const checklistKeys = [
  'PostingGuidance.checkStructuredScope',
  'PostingGuidance.checkAddressPrivacy',
  'PostingGuidance.checkPricingClarity',
  'PostingGuidance.checkStructuredApplications',
] as const;

type PostingProofChecklistProps = {
  testID?: string;
};

export function PostingProofChecklist({ testID }: PostingProofChecklistProps) {
  const { t } = useTranslation();

  return (
    <View testID={testID} className="rounded-md bg-card p-md gap-sm">
      {checklistKeys.map((key) => (
        <View key={key} className="flex-row items-start gap-sm">
          <CheckCircle2 size={16} color={colors.verified} />
          <Text className="flex-1 text-caption text-text-secondary leading-relaxed">{t(key)}</Text>
        </View>
      ))}
    </View>
  );
}
