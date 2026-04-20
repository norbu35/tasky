import { MapPin, Star } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import type { CustomerTask } from './CustomerTaskDetail.model';
import { formatBudget, prettifyKey, formatAnswerValue } from './CustomerTaskDetail.model';

const { colors, typography } = mobileTheme;
const { taskDetail, tint } = mobileSurfaces;

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-md">
      <Text
        className="flex-1 text-label font-bold text-text-secondary uppercase"
        style={{ letterSpacing: taskDetail.labelTracking }}
      >
        {label}
      </Text>
      <Text className="flex-1 text-label font-bold text-foreground text-right">{value}</Text>
    </View>
  );
}

export function IntakeAnswersSection({
  answers,
  t,
}: {
  answers: Record<string, unknown>;
  t: (k: string) => string;
}) {
  const entries = Object.entries(answers).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;

  return (
    <View className="bg-muted rounded-sm p-lg gap-md">
      <Text
        className="text-caption font-bold text-text-secondary uppercase"
        style={{ letterSpacing: taskDetail.sectionTracking }}
      >
        {t('TaskDetailCustomerScreen.intakeTitle')}
      </Text>
      {entries.map(([key, value]) => (
        <View key={key} className="gap-xs">
          <Text className="text-caption text-text-secondary">{prettifyKey(key)}</Text>
          <View className="flex-row flex-wrap gap-xs">
            {Array.isArray(value) ? (
              value.map((item, idx) => (
                <View key={`${key}-${idx}`} className="px-md py-sm rounded-sm bg-card">
                  <Text className="text-label font-bold text-foreground">
                    {prettifyKey(String(item))}
                  </Text>
                </View>
              ))
            ) : (
              <View className="px-md py-sm rounded-sm bg-card">
                <Text className="text-label font-bold text-foreground">
                  {formatAnswerValue(value, t)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

interface BudgetCardProps {
  budget?: number | null;
  applicantCount: number;
  t: (k: string) => string;
}

export function BudgetCard({ budget, applicantCount, t }: BudgetCardProps) {
  return (
    <View className="bg-primary-deep rounded-lg p-lg gap-sm" style={elevations.soft}>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-caption font-bold uppercase"
          style={{
            letterSpacing: taskDetail.sectionTracking,
            color: tint.primaryForegroundMuted,
          }}
        >
          {t('TaskDetailCustomerScreen.budgetLabel')}
        </Text>
        <View
          className="px-sm py-xs rounded-full"
          style={{ backgroundColor: tint.primaryForegroundSoft }}
        >
          <Text className="text-micro font-bold text-primary-foreground">
            {applicantCount} {t('TaskDetailCustomerScreen.applicants')}
          </Text>
        </View>
      </View>
      <Text
        className="text-secondary font-extrabold"
        style={{ fontSize: typography.heroTitle, lineHeight: taskDetail.budgetLineHeight }}
      >
        {formatBudget(budget)}
      </Text>
    </View>
  );
}

interface ApplicantsSectionProps {
  hasApplicants: boolean;
  applicantCount: number;
  t: (k: string) => string;
}

export function ApplicantsSection({ hasApplicants, applicantCount, t }: ApplicantsSectionProps) {
  return (
    <View className="bg-muted rounded-sm p-lg gap-sm">
      <View className="flex-row justify-between items-center">
        <Text className="text-subtitle font-extrabold text-foreground">
          {t('TaskDetailCustomerScreen.applicants')}
        </Text>
        <Text
          className="text-caption font-extrabold text-center text-primary-deep"
          style={{
            minWidth: taskDetail.pillMinWidth,
            paddingHorizontal: taskDetail.pillInsetX,
            paddingVertical: taskDetail.pillInsetY,
            borderRadius: 9999,
            backgroundColor: tint.primarySoft,
          }}
        >
          {applicantCount}
        </Text>
      </View>
      {hasApplicants ? (
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('TaskDetailCustomerScreen.applicationsReceived')}
        </Text>
      ) : (
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('TaskDetailCustomerScreen.noApplicants')}
        </Text>
      )}
    </View>
  );
}

interface LocationCardProps {
  locationText?: string;
  t: (k: string) => string;
}

export function LocationCard({ locationText, t }: LocationCardProps) {
  return (
    <View className="rounded-lg p-lg gap-sm" style={{ backgroundColor: tint.primarySubtle }}>
      <View className="flex-row items-center gap-sm">
        <MapPin size={16} color={colors.primaryDeep} />
        <Text className="flex-1 text-body font-bold text-primary-deep">{locationText ?? ''}</Text>
      </View>
      <Text className="text-caption text-text-secondary leading-relaxed">
        {t('TaskDetailCustomerScreen.locationNote')}
      </Text>
    </View>
  );
}

interface TaskerCardProps {
  tasker: NonNullable<CustomerTask['tasker']>;
  onPress: () => void;
  t: (k: string) => string;
}

export function TaskerCard({ tasker, onPress, t }: TaskerCardProps) {
  return (
    <Touchable
      className="bg-card rounded-lg p-lg"
      style={elevations.soft}
      onPress={onPress}
      testID="task-detail-customer-screen-tasker-card"
      accessibilityRole="button"
    >
      <View className="flex-row items-center gap-md">
        <ProfileAvatar
          uri={tasker.avatar_url}
          name={tasker.full_name}
          size="lg"
          showVerified={tasker.is_pro}
        />
        <View className="flex-1 gap-xs">
          <Text className="text-subtitle font-extrabold text-foreground">{tasker.full_name}</Text>
          <View className="flex-row items-center gap-xs">
            <Star size={16} color={colors.accent} fill={colors.accent} />
            <Text className="text-label font-bold text-foreground">{tasker.rating_avg ?? 0}</Text>
          </View>
          <Text className="text-caption text-text-secondary">
            {t('TaskDetailCustomerScreen.assignedTasker')}
          </Text>
        </View>
      </View>
    </Touchable>
  );
}

interface TaskHeaderProps {
  status: string;
  description: string;
  t: (k: string) => string;
}

export function TaskHeader({ status, description, t }: TaskHeaderProps) {
  return (
    <View className="gap-sm">
      <StatusBadge
        status={
          (status === 'TASKER_MARKED_DONE' ? 'assigned' : status.toLowerCase()) as
            | 'open'
            | 'assigned'
            | 'completed'
            | 'cancelled'
            | 'no_show'
        }
      />
      <Text className="text-heading font-display-bold text-primary-deep leading-tight">
        {description}
      </Text>
      <Text
        className="text-caption font-bold text-text-secondary uppercase"
        style={{ letterSpacing: taskDetail.sectionTracking }}
      >
        {t('TaskDetailCustomerScreen.sectionDetails')}
      </Text>
    </View>
  );
}

export { DetailTemplate } from '@/components/templates/DetailTemplate';
export { TaskCancelSheet } from '../components/TaskCancelSheet';
export { CompletedBanner, CancelledBanner } from './CustomerTaskDetail.Banners';
export { PhotosSection } from './CustomerTaskDetail.Photos';
