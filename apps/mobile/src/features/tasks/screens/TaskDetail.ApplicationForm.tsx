import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

interface ApplicationFormProps {
  isQuoteMode: boolean;
  isQuoteValid: boolean;
  applicationNote: string;
  quotePrice: string;
  onApplicationNoteChange: (text: string) => void;
  onQuotePriceChange: (text: string) => void;
}

export function ApplicationForm({
  isQuoteMode,
  isQuoteValid,
  applicationNote,
  quotePrice,
  onApplicationNoteChange,
  onQuotePriceChange,
}: ApplicationFormProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-md bg-muted rounded-md p-lg" testID="application-form">
      <View className="gap-xs">
        <Text className="text-body font-sans-bold text-primary-deep">
          {isQuoteMode
            ? t('tasker.taskDetail.quoteModeTitle')
            : t('tasker.taskDetail.budgetModeTitle')}
        </Text>
        <Text className="text-caption text-text-secondary leading-relaxed">
          {isQuoteMode
            ? t('tasker.taskDetail.quoteModeHelper')
            : t('tasker.taskDetail.budgetModeHelper')}
        </Text>
      </View>

      {isQuoteMode ? (
        <FormField
          label={t('tasker.taskDetail.quotePriceLabel')}
          helperText={t('tasker.taskDetail.quotePriceHelper')}
          errorText={
            quotePrice !== '' && !isQuoteValid ? t('tasker.taskDetail.quotePriceError') : undefined
          }
        >
          <Input
            testID="application-quote-input"
            value={quotePrice}
            onChangeText={(text) => onQuotePriceChange(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder={t('tasker.taskDetail.quotePricePlaceholder')}
            invalid={quotePrice !== '' && !isQuoteValid}
          />
        </FormField>
      ) : null}

      <FormField
        label={t('tasker.taskDetail.applicationNoteLabel')}
        helperText={t('tasker.taskDetail.applicationNoteHelper')}
      >
        <Input
          testID="application-note-input"
          value={applicationNote}
          onChangeText={onApplicationNoteChange}
          placeholder={t('tasker.taskDetail.applicationNotePlaceholder')}
          multiline
          className="min-h-[88px] h-auto"
          textAlignVertical="top"
        />
      </FormField>
    </View>
  );
}
