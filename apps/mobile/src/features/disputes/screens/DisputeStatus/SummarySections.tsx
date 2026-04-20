import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import { DISPUTE_STATUS_SURFACE } from './model';

const { colors } = mobileTheme;

export function StatusBadge({
  label,
  badgeStyle,
}: {
  label: string;
  badgeStyle: 'warning' | 'success' | 'neutral' | 'danger';
}) {
  return (
    <View className="items-center pb-xs">
      <View
        className={cn(
          'rounded-full px-md py-xs items-center justify-center',
          badgeStyle === 'warning' && 'bg-status-open',
          badgeStyle === 'success' && 'bg-status-assigned',
          badgeStyle === 'neutral' && 'bg-muted',
          badgeStyle === 'danger' && 'bg-danger',
        )}
      >
        <Text
          className={cn(
            'text-label font-sans-bold tracking-wide',
            badgeStyle === 'warning' && 'text-status-open-foreground',
            badgeStyle === 'success' && 'text-status-assigned-foreground',
            badgeStyle === 'neutral' && 'text-primary-deep',
            badgeStyle === 'danger' && 'text-primary-foreground',
          )}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export function DisputeSummary({
  sectionTitle,
  bookingCategory,
  bookingReference,
  submittedAtLabel,
  reason,
  detailTypeLabel,
  detailBookingLabel,
  detailSubmittedLabel,
  detailReasonLabel,
}: {
  sectionTitle: string;
  bookingCategory: string;
  bookingReference: string;
  submittedAtLabel: string;
  reason: string;
  detailTypeLabel: string;
  detailBookingLabel: string;
  detailSubmittedLabel: string;
  detailReasonLabel: string;
}) {
  return (
    <View className="bg-muted rounded-lg p-lg gap-item">
      <Text className="text-heading font-sans-bold text-primary-deep">{sectionTitle}</Text>
      <View className="gap-xs">
        <Text className="text-caption text-text-secondary uppercase tracking-[0.075em]">
          {detailTypeLabel}
        </Text>
        <Text className="text-body font-sans-bold text-primary-deep leading-snug">
          {bookingCategory}
        </Text>
      </View>
      <View className="gap-xs">
        <Text className="text-caption text-text-secondary uppercase tracking-[0.075em]">
          {detailBookingLabel}
        </Text>
        <Text className="text-body font-sans-bold text-primary-deep leading-snug">
          {bookingReference}
        </Text>
      </View>
      <View className="gap-xs">
        <Text className="text-caption text-text-secondary uppercase tracking-[0.075em]">
          {detailSubmittedLabel}
        </Text>
        <Text className="text-body font-sans-bold text-primary-deep leading-snug">
          {submittedAtLabel}
        </Text>
      </View>
      <View className="gap-xs">
        <Text className="text-caption text-text-secondary uppercase tracking-[0.075em]">
          {detailReasonLabel}
        </Text>
        <Text className="text-body font-sans-bold text-primary-deep leading-snug">{reason}</Text>
      </View>
    </View>
  );
}

export function ResolutionSection({
  label,
  resolutionText,
  sectionTitle,
}: {
  label: string;
  resolutionText: string;
  sectionTitle: string;
}) {
  return (
    <View className="bg-muted rounded-lg p-lg gap-item">
      <Text className="text-heading font-sans-bold text-primary-deep">{sectionTitle}</Text>
      <View className="items-center gap-sm">
        <View
          className="rounded-lg bg-chip-inactive items-center justify-center"
          style={{
            width: DISPUTE_STATUS_SURFACE.timeline.resolutionIconBox,
            height: DISPUTE_STATUS_SURFACE.timeline.resolutionIconBox,
          }}
        >
          <AlertTriangle size={20} color={colors.secondary} />
        </View>
        <Text className="text-body font-sans-bold text-primary-deep text-center">{label}</Text>
        <Text className="text-body text-text-secondary text-center leading-normal">
          {resolutionText}
        </Text>
      </View>
    </View>
  );
}

export function PhaseNote({ text }: { text: string }) {
  return (
    <View className="bg-muted rounded-lg p-lg">
      <Text className="text-body text-text-secondary text-center leading-normal">{text}</Text>
    </View>
  );
}
