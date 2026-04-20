import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';

import { type ApplicantItem } from './ApplicantsSelection.model';

interface ConfirmationSheetProps {
  selectedApplicant: ApplicantItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmationSheet({
  selectedApplicant,
  isOpen,
  onClose,
  onConfirm,
}: ConfirmationSheetProps) {
  const { t } = useTranslation();

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.applicants.confirmTitle')}
      testID="applicant-accept-sheet"
    >
      <Text className="text-body text-text-secondary">{t('customer.applicants.confirmBody')}</Text>
      {selectedApplicant ? (
        <View className="rounded-lg bg-muted p-lg gap-xs">
          <Text className="text-title font-sans-bold text-primary-deep">
            {selectedApplicant.name}
          </Text>
          <Text className="text-caption text-text-secondary">
            {t('customer.applicants.confirmBody')}
          </Text>
        </View>
      ) : null}
      <View className="flex-row items-center gap-md">
        <Button label={t('common.cancel')} variant="ghost" onPress={onClose} style={{ flex: 1 }} />
        <Button
          label={t('customer.applicants.confirmCta')}
          onPress={onConfirm}
          style={{ flex: 1 }}
          testID="applicant-accept-sheet-confirm"
        />
      </View>
    </ModalSheetTemplate>
  );
}
