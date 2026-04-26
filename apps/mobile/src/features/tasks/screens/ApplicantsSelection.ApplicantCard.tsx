import { CircleDollarSign, MessageSquare, ShieldCheck, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';

import { type ApplicantItem } from './ApplicantsSelection.model';

const { colors, spacing } = mobileTheme;
const APPLICANT_SURFACE = {
  signalGap: spacing.xs,
  rowGap: spacing.md,
  titleClusterGap: spacing.xs / 2,
} as const;

function formatTugrik(amount?: number | null): string {
  if (amount == null) return '';
  return `₮${amount.toLocaleString()}`;
}

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
      style={{ gap: APPLICANT_SURFACE.rowGap, ...elevations.soft }}
    >
      <View className="flex-row items-center" style={{ gap: APPLICANT_SURFACE.rowGap }}>
        <ProfileAvatar
          uri={applicant.avatarUrl}
          name={applicant.name}
          size="md"
          showVerified={applicant.isVerified}
        />
        <View className="flex-1" style={{ gap: APPLICANT_SURFACE.titleClusterGap }}>
          <Text className="text-subtitle font-sans-bold text-foreground">{applicant.name}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap" style={{ gap: APPLICANT_SURFACE.signalGap }}>
        {applicant.isVerified ? (
          <View className="flex-row items-center rounded-full bg-muted px-sm py-xs gap-xs">
            <ShieldCheck size={14} color={colors.trustMuted} />
            <Text className="text-caption font-sans-bold text-trust-muted">
              {t('customer.applicants.signalVerified')}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center rounded-full bg-muted px-sm py-xs gap-xs">
          <MessageSquare size={14} color={colors.textSecondary} />
          <Text className="text-caption text-text-secondary">
            {t(
              applicant.responseSignal === 'detailed'
                ? 'customer.applicants.signalDetailedResponse'
                : 'customer.applicants.signalBriefResponse',
            )}
          </Text>
        </View>
        <View className="flex-row items-center rounded-full bg-muted px-sm py-xs gap-xs">
          {applicant.publicRatingVisible ? (
            <>
              <Star size={14} color={colors.accent} fill={colors.accent} />
              <Text className="text-caption font-sans-bold text-foreground">
                {applicant.rating.toFixed(1)}
              </Text>
              <Text className="text-caption text-text-secondary">
                {t('customer.applicants.signalCompletedJobs', { count: applicant.reviewCount })}
              </Text>
            </>
          ) : (
            <Text className="text-caption text-text-secondary">
              {t('shared.profile.lowReviewTitle')}
            </Text>
          )}
        </View>
        {applicant.quotePrice != null ? (
          <View className="flex-row items-center rounded-full bg-muted px-sm py-xs gap-xs">
            <CircleDollarSign size={14} color={colors.secondary} />
            <Text className="text-caption font-sans-bold text-foreground">
              {t('customer.applicants.signalQuote', {
                amount: formatTugrik(applicant.quotePrice),
              })}
            </Text>
          </View>
        ) : null}
      </View>

      {applicant.message ? (
        <Text className="text-label text-muted-foreground leading-snug">{applicant.message}</Text>
      ) : null}

      <View className="flex-row items-center pt-xs" style={{ gap: APPLICANT_SURFACE.rowGap }}>
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
