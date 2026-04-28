import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

interface PricingModeSelectorProps {
  pricingMode: 'BUDGET' | 'QUOTE';
  onChange: (mode: 'BUDGET' | 'QUOTE') => void;
}

export function PricingModeSelector({ pricingMode, onChange }: PricingModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-sm">
      <Text className="text-caption font-bold text-text-secondary uppercase tracking-[0.5px]">
        {t('ScheduleBudgetScreen.pricingModeLabel')}
      </Text>
      <View className="flex-row gap-sm">
        <Button
          testID="pricing-mode-budget"
          label={t('ScheduleBudgetScreen.pricingModeBudget')}
          variant={pricingMode === 'BUDGET' ? 'default' : 'outline'}
          onPress={() => onChange('BUDGET')}
          className="flex-1"
        />
        <Button
          testID="pricing-mode-quote"
          label={t('ScheduleBudgetScreen.pricingModeQuote')}
          variant={pricingMode === 'QUOTE' ? 'default' : 'outline'}
          onPress={() => onChange('QUOTE')}
          className="flex-1"
        />
      </View>
    </View>
  );
}

export function QuoteModeNotice() {
  const { t } = useTranslation();

  return (
    <View className="rounded-md bg-muted p-md gap-xs" testID="schedule-quote-mode-note">
      <Text className="text-body font-sans-bold text-primary-deep">
        {t('ScheduleBudgetScreen.quoteModeTitle')}
      </Text>
      <Text className="text-caption text-text-secondary leading-relaxed">
        {t('ScheduleBudgetScreen.quoteModeHelper')}
      </Text>
    </View>
  );
}
