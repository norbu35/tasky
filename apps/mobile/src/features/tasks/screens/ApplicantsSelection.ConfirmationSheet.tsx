import { X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

import { type ApplicantItem } from './ApplicantsSelection.model';

const { colors } = mobileTheme;

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
      titleAlign="left"
      hideDefaultAction
      headerTrailing={
        <Touchable
          onPress={onClose}
          accessibilityRole="button"
          testID="applicant-accept-sheet-close"
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
        >
          <X size={18} color={colors.foreground} />
        </Touchable>
      }
      footer={
        <View className="gap-sm pt-xs">
          <Button
            label={t('customer.applicants.confirmCta')}
            onPress={onConfirm}
            testID="applicant-accept-sheet-confirm"
          />
          <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
        </View>
      }
    >
      <Text className="text-body text-text-secondary leading-snug">
        {t('customer.applicants.confirmBody')}
      </Text>
      {selectedApplicant ? (
        <View className="border-y border-border py-md gap-sm">
          <View className="flex-row items-center gap-md">
            <ProfileAvatar
              uri={selectedApplicant.avatarUrl}
              name={selectedApplicant.name}
              size="lg"
              showVerified={selectedApplicant.isVerified}
            />
            <View className="flex-1 gap-xs">
              <Text className="text-subtitle font-sans-bold text-primary-deep">
                {selectedApplicant.name}
              </Text>
              <Text className="text-caption text-text-secondary">
                {t(
                  selectedApplicant.publicRatingVisible
                    ? 'customer.applicants.confirmEvidenceVisible'
                    : 'customer.applicants.confirmEvidencePending',
                )}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </ModalSheetTemplate>
  );
}
