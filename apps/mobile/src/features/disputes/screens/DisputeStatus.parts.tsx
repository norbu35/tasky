import { AlertTriangle, CircleAlert, Scale } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import { type DisputeLike, DISPUTE_STATUS_SURFACE, getEvidenceLabel } from './DisputeStatus.model';

export { TimelineSection } from './DisputeStatus.timeline';
export { DISPUTE_STATUS_SURFACE as SURFACE } from './DisputeStatus.model';

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

export function EvidenceList({
  items,
  sectionTitle,
  emptyLabel,
  t,
}: {
  items: DisputeLike['evidence'];
  sectionTitle: string;
  emptyLabel: string;
  t: (key: string) => string;
}) {
  const evidenceItems = Array.isArray(items) ? items : [];
  return (
    <View className="bg-card rounded-lg p-lg gap-sm" style={elevations.soft}>
      <Text className="text-heading font-sans-bold text-primary-deep">{sectionTitle}</Text>
      {evidenceItems.length > 0 ? (
        evidenceItems.map((item, index) => (
          <View
            key={`${index}-${typeof item === 'string' ? item : item.type}-${typeof item === 'string' ? 'string' : (item.storage_key ?? 'item')}`}
            className="flex-row items-start gap-sm"
          >
            <View
              className="rounded-full bg-primary-deep mt-sm"
              style={{
                width: DISPUTE_STATUS_SURFACE.timeline.evidenceBullet,
                height: DISPUTE_STATUS_SURFACE.timeline.evidenceBullet,
              }}
            />
            <Text className="flex-1 text-body text-primary-deep leading-snug">
              {getEvidenceLabel(item, t)}
            </Text>
          </View>
        ))
      ) : (
        <Text className="text-body text-text-secondary">{emptyLabel}</Text>
      )}
    </View>
  );
}

export function DecorativeScale() {
  return (
    <View
      className="rounded-lg overflow-hidden items-center justify-center"
      style={{
        height: DISPUTE_STATUS_SURFACE.timeline.decorativeScaleHeight,
        opacity: 0.4,
      }}
    >
      <Scale size={24} color={colors.textSecondary} />
    </View>
  );
}

export function LoadingState() {
  return (
    <View className="items-center justify-center py-3xl">
      <ActivityIndicator size="small" color={colors.primaryDeep} />
    </View>
  );
}

export function ErrorState({
  errorMessage,
  retryLabel,
  onRetry,
}: {
  errorMessage: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <View className="bg-card rounded-lg p-lg items-center gap-sm">
      <CircleAlert size={24} color={colors.danger} />
      <Text className="text-body text-primary-deep text-center leading-relaxed">
        {errorMessage}
      </Text>
      <Touchable onPress={onRetry} className="px-lg py-sm rounded-md border border-primary-deep">
        <Text className="text-body text-primary-deep font-sans-bold">{retryLabel}</Text>
      </Touchable>
    </View>
  );
}
