import { Award, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui/Button';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import { type ApplicantItem } from './ApplicantsSelection.model';

const { colors, spacing } = mobileTheme;
const { tint } = mobileSurfaces;
const APPLICANT_SURFACE = {
  recommendedAwardGap: spacing.xs,
  recommendedRowGap: spacing.md,
  titleClusterGap: spacing.xs / 2,
} as const;

interface ApplicantCardProps {
  applicant: ApplicantItem;
  onAccept: (application: ApplicantItem) => void;
  onViewProfile: (taskerId: string) => void;
}

export function ApplicantCard({ applicant, onAccept, onViewProfile }: ApplicantCardProps) {
  const { t } = useTranslation();

  return (
    <View
      testID="SCR-CUST-011"
      className="rounded-lg bg-card p-lg"
      style={{ gap: APPLICANT_SURFACE.recommendedRowGap, ...elevations.soft }}
    >
      <View className="flex-row items-center" style={{ gap: APPLICANT_SURFACE.recommendedRowGap }}>
        <ProfileAvatar
          uri={applicant.avatarUrl}
          name={applicant.name}
          size="md"
          showVerified={applicant.isVerified}
        />
        <View className="flex-1" style={{ gap: APPLICANT_SURFACE.titleClusterGap }}>
          <Text className="text-subtitle font-sans-bold text-foreground">{applicant.name}</Text>
          <View className="flex-row items-center" style={{ gap: spacing.xs }}>
            <Star size={16} color={colors.accent} fill={colors.accent} />
            <Text className="text-label font-sans-bold text-foreground">{applicant.rating}</Text>
            <Text className="text-caption text-text-secondary">·</Text>
            <Text className="text-caption text-text-secondary">
              {applicant.reviewCount} {t('applicants.jobs')}
            </Text>
            {applicant.isVerified ? (
              <>
                <Text className="text-caption text-text-secondary">·</Text>
                <Text className="text-caption font-sans-bold text-trust-muted">
                  {t('applicants.verified')}
                </Text>
              </>
            ) : null}
          </View>
        </View>
        {applicant.isRecommended ? (
          <View
            className="flex-row items-center rounded-full px-sm py-xs"
            style={{ gap: APPLICANT_SURFACE.recommendedAwardGap, backgroundColor: tint.trustSoft }}
          >
            <Award size={16} color={colors.trustMuted} />
            <Text className="text-caption font-sans-bold text-trust-muted">
              {t('applicants.recommended')}
            </Text>
          </View>
        ) : null}
      </View>

      {applicant.message ? (
        <Text className="text-label text-muted-foreground leading-snug">{applicant.message}</Text>
      ) : null}

      <View
        className="flex-row items-center pt-xs"
        style={{ gap: APPLICANT_SURFACE.recommendedRowGap }}
      >
        <Touchable
          className="flex-1 min-h-[44px] bg-primary rounded-md items-center justify-center"
          onPress={() => onAccept(applicant)}
          testID={`applicant-accept-${applicant.taskerId}`}
          accessibilityRole="button"
        >
          <Text className="text-label font-sans-bold text-primary-foreground">
            {t('customer.applicants.accept')}
          </Text>
        </Touchable>
        <Touchable
          className="py-sm px-xs items-center"
          onPress={() => onViewProfile(applicant.taskerId)}
          testID={`applicant-view-profile-${applicant.taskerId}`}
          accessibilityRole="button"
        >
          <Text className="text-label font-sans-bold text-primary-deep">
            {t('customer.applicants.viewProfile')}
          </Text>
        </Touchable>
      </View>
    </View>
  );
}

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
