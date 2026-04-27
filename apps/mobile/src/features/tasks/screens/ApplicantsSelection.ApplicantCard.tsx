import { CircleDollarSign, MessageSquare, ShieldCheck, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { MIN_PUBLIC_REVIEW_COUNT } from '@/features/profile/model';

import { type ApplicantItem } from './ApplicantsSelection.model';

const { colors, spacing } = mobileTheme;
const APPLICANT_SURFACE = {
  metricGap: spacing.xs,
  rowGap: spacing.md,
  sectionGap: spacing.sm,
  titleClusterGap: spacing.xs / 2,
} as const;

function formatTugrik(amount?: number | null): string {
  if (amount == null) return '';
  return `₮${amount.toLocaleString()}`;
}

interface ApplicantCardProps {
  applicant: ApplicantItem;
  index: number;
  onAccept: (application: ApplicantItem) => void;
  onViewProfile: (application: ApplicantItem) => void;
}

interface EvidenceRowProps {
  icon: React.ReactNode;
  title: string;
  body?: string;
  testID?: string;
}

function EvidenceRow({ icon, title, body, testID }: EvidenceRowProps) {
  return (
    <View
      testID={testID}
      className="flex-row border-b border-border py-sm"
      style={{ gap: APPLICANT_SURFACE.sectionGap }}
    >
      <View className="pt-xs">{icon}</View>
      <View className="flex-1" style={{ gap: APPLICANT_SURFACE.titleClusterGap }}>
        <Text className="text-label font-sans-semibold text-foreground">{title}</Text>
        {body ? (
          <Text className="text-caption text-text-secondary leading-snug">{body}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function ApplicantCard({ applicant, index, onAccept, onViewProfile }: ApplicantCardProps) {
  const { t } = useTranslation();
  const reviewTitle = applicant.publicRatingVisible
    ? `${applicant.rating.toFixed(1)} · ${t('customer.applicants.signalPublicReviews', {
        count: applicant.reviewCount,
      })}`
    : t('customer.applicants.signalCompletedJobs', {
        count: applicant.completedJobs,
      });
  const reviewBody = applicant.publicRatingVisible
    ? t('customer.applicants.signalPublicReviewsBody', { count: applicant.reviewCount })
    : t('customer.applicants.signalLowReviewBody', { count: MIN_PUBLIC_REVIEW_COUNT });
  const responseTitle = t(
    applicant.responseSignal === 'detailed'
      ? 'customer.applicants.signalDetailedResponse'
      : 'customer.applicants.signalBriefResponse',
  );
  const responseBody = t(
    applicant.responseSignal === 'detailed'
      ? 'customer.applicants.signalDetailedResponseBody'
      : 'customer.applicants.signalBriefResponseBody',
  );
  const pricingTitle =
    applicant.quotePrice != null
      ? t('customer.applicants.signalQuote', {
          amount: formatTugrik(applicant.quotePrice),
        })
      : t('customer.applicants.signalAcceptsBudget');
  const pricingBody =
    applicant.quotePrice != null
      ? t('customer.applicants.signalQuoteBody')
      : t('customer.applicants.signalAcceptsBudgetBody');

  return (
    <View
      testID={`applicant-card-${index}`}
      className="rounded-lg bg-card p-lg"
      style={{ gap: APPLICANT_SURFACE.rowGap, ...elevations.soft }}
    >
      <View className="flex-row items-center" style={{ gap: APPLICANT_SURFACE.rowGap }}>
        <ProfileAvatar
          uri={applicant.avatarUrl}
          name={applicant.name}
          size="lg"
          showVerified={applicant.isVerified}
        />
        <View className="flex-1" style={{ gap: APPLICANT_SURFACE.titleClusterGap }}>
          <Text className="text-subtitle font-sans-bold text-foreground">{applicant.name}</Text>
          <Text className="text-caption text-text-secondary">
            {t(
              applicant.isVerified
                ? 'customer.applicants.profilePreviewVerified'
                : 'customer.applicants.profilePreviewUnverified',
            )}
          </Text>
        </View>
        {applicant.publicRatingVisible ? (
          <View className="items-end" style={{ gap: APPLICANT_SURFACE.metricGap }}>
            <View className="flex-row items-center" style={{ gap: spacing.xs / 2 }}>
              <Star size={14} color={colors.foreground} fill={colors.foreground} />
              <Text className="text-label font-sans-bold text-foreground">
                {applicant.rating.toFixed(1)}
              </Text>
            </View>
            <Text className="text-caption text-text-secondary">
              {t('customer.applicants.signalPublicReviews', { count: applicant.reviewCount })}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ gap: APPLICANT_SURFACE.sectionGap }}>
        <Text className="text-caption font-sans-bold uppercase text-text-secondary">
          {t('customer.applicants.structuredSignalsLabel')}
        </Text>
        <View>
          <EvidenceRow
            icon={<ShieldCheck size={18} color={colors.trustMuted} />}
            title={t('customer.applicants.signalVerified')}
            body={t(
              applicant.isVerified
                ? 'customer.applicants.signalVerifiedBody'
                : 'customer.applicants.signalUnverifiedBody',
            )}
            testID={`applicant-signal-verified-${index}`}
          />
          <EvidenceRow
            icon={<MessageSquare size={18} color={colors.textSecondary} />}
            title={responseTitle}
            body={responseBody}
            testID={`applicant-signal-response-${index}`}
          />
          <EvidenceRow
            icon={
              applicant.publicRatingVisible ? (
                <Star size={18} color={colors.foreground} fill={colors.foreground} />
              ) : (
                <Star size={18} color={colors.textSecondary} />
              )
            }
            title={reviewTitle}
            body={reviewBody}
            testID={`applicant-signal-reviews-${index}`}
          />
          <EvidenceRow
            icon={<CircleDollarSign size={18} color={colors.secondary} />}
            title={pricingTitle}
            body={pricingBody}
            testID={`applicant-signal-pricing-${index}`}
          />
        </View>
      </View>

      {applicant.message ? (
        <View style={{ gap: APPLICANT_SURFACE.titleClusterGap }}>
          <Text className="text-caption font-sans-bold uppercase text-text-secondary">
            {t('customer.applicants.applicationMessageLabel')}
          </Text>
          <Text className="text-label text-muted-foreground leading-snug">{applicant.message}</Text>
        </View>
      ) : null}

      <View className="flex-row items-center pt-xs" style={{ gap: APPLICANT_SURFACE.rowGap }}>
        <Touchable
          className="flex-1 min-h-[44px] bg-primary rounded-md items-center justify-center"
          onPress={() => onAccept(applicant)}
          testID={`applicant-accept-${index}`}
          accessibilityRole="button"
        >
          <Text className="text-label font-sans-bold text-primary-foreground">
            {t('customer.applicants.accept')}
          </Text>
        </Touchable>
        <Touchable
          className="py-sm px-xs items-center"
          onPress={() => onViewProfile(applicant)}
          testID={`applicant-view-profile-${index}`}
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
