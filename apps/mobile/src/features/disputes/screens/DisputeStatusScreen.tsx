import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '@/components/shells';
import { Touchable } from '@/components/ui/Touchable';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';

import {
  StatusBadge,
  DisputeSummary,
  ResolutionSection,
  PhaseNote,
} from './DisputeStatus.SummarySections';
import { EvidenceList } from './DisputeStatus.EvidenceList';
import { DecorativeScale, LoadingState, ErrorState } from './DisputeStatus.States';
import { TimelineSection } from './DisputeStatus.timeline';
import { useDisputeStatus } from './useDisputeStatus';

const { colors, spacing } = mobileTheme;

export default function DisputeStatusScreen() {
  const {
    t,
    router,
    dispute,
    status,
    meta,
    bookingCategory,
    bookingReference,
    submittedAtLabel,
    timeline,
    evidenceItems,
    isLoading,
    isError,
    refetch,
    scrollContentStyle,
  } = useDisputeStatus();

  return (
    <ScreenContainer testID="dispute-status-screen">
      <View
        className="flex-row items-center justify-between pb-micro"
        style={{ minHeight: screenLayout.header.minHeight }}
      >
        <Touchable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="w-3xl h-3xl items-start justify-center"
          hitSlop={spacing.sm}
          testID="dispute-status-back"
        >
          <ChevronLeft size={20} color={colors.primary} />
        </Touchable>
        <Text className="flex-1 text-subtitle font-sans-bold text-primary-deep text-center mx-sm">
          {t('customer.disputes.pageTitle')}
        </Text>
        <View className="w-3xl" />
      </View>
      <InsetScrollView
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        bounces={false}
        extraBottomInset={spacing.xl}
      >
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            errorMessage={t('customer.disputes.errorToast')}
            retryLabel={t('customer.disputes.retry')}
            onRetry={() => void refetch()}
          />
        ) : dispute ? (
          <>
            <View className="items-center gap-sm">
              <StatusBadge label={meta.label} badgeStyle={meta.badgeStyle} />
              <Text className="text-body text-text-secondary text-center px-md leading-loose">
                {meta.description}
              </Text>
            </View>

            <DisputeSummary
              sectionTitle={t('customer.disputes.sectionSummary')}
              bookingCategory={bookingCategory}
              bookingReference={bookingReference}
              submittedAtLabel={submittedAtLabel}
              reason={dispute.reason}
              detailTypeLabel={t('customer.disputes.detailType')}
              detailBookingLabel={t('customer.disputes.detailBooking')}
              detailSubmittedLabel={t('customer.disputes.detailSubmitted')}
              detailReasonLabel={t('customer.disputes.detailReason')}
            />

            <TimelineSection
              timeline={timeline}
              status={status}
              sectionTitle={t('customer.disputes.sectionProcess')}
            />

            <ResolutionSection
              label={meta.label}
              resolutionText={meta.resolutionText}
              sectionTitle={t('customer.disputes.sectionResolution')}
            />

            <PhaseNote text={t('customer.disputes.phase1Note')} />

            <EvidenceList
              items={evidenceItems}
              sectionTitle={t('customer.disputes.sectionEvidence')}
              emptyLabel={t('customer.disputes.noEvidence')}
              t={t}
            />

            <DecorativeScale />
          </>
        ) : null}
      </InsetScrollView>
    </ScreenContainer>
  );
}
