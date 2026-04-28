import { Banknote, CalendarClock, CheckCircle, FileText, MapPin } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { formatDateTime } from '@/utils/formatDate';

import { type CustomerBooking } from './model';

const { colors, spacing } = mobileTheme;

function DividerSection({ children, testID }: { children: React.ReactNode; testID?: string }) {
  return (
    <View className="border-b border-border pb-lg mb-lg" testID={testID}>
      {children}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  body,
  note,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  body: React.ReactNode;
  note?: string;
  testID?: string;
}) {
  return (
    <View className="flex-row py-md" style={{ gap: spacing.md }} testID={testID}>
      <View className="w-8 items-center pt-xs">{icon}</View>
      <View className="flex-1">
        <Text className="text-body font-sans-bold text-primary-deep">{label}</Text>
        {typeof body === 'string' ? (
          <Text className="text-body text-text-secondary leading-[22px] mt-xs">{body}</Text>
        ) : (
          <View className="mt-xs">{body}</View>
        )}
        {note ? <Text className="text-caption text-text-secondary mt-xs">{note}</Text> : null}
      </View>
    </View>
  );
}

interface TaskerSectionProps {
  booking: CustomerBooking;
  onTaskerPress: () => void;
}

export function TaskerSection({ booking, onTaskerPress }: TaskerSectionProps) {
  const { t } = useTranslation();
  return (
    <DividerSection>
      <Text className="text-heading font-display-bold text-primary-deep mb-md">
        {t('customer.bookings.sectionTasker')}
      </Text>
      <Touchable
        className="flex-row items-center rounded-md py-sm"
        style={{ gap: spacing.md }}
        onPress={onTaskerPress}
        testID="booking-detail-screen-tasker-card"
      >
        <ProfileAvatar
          uri={booking.tasker?.avatar_url}
          name={booking.tasker?.full_name}
          size="lg"
          showVerified
        />
        <View className="flex-1">
          <Text className="text-subtitle font-sans-bold text-primary-deep">
            {booking.tasker?.full_name}
          </Text>
          <View className="flex-row items-center mt-xs" style={{ gap: spacing.xs }}>
            <CheckCircle size={16} color={colors.verified} />
            <Text className="text-caption text-text-secondary">
              {t('customer.bookings.taskerVerified')}
            </Text>
          </View>
        </View>
      </Touchable>
    </DividerSection>
  );
}

interface TaskSummarySectionProps {
  booking: CustomerBooking;
}

export function TaskSummarySection({ booking }: TaskSummarySectionProps) {
  const { t } = useTranslation();
  const scheduledAt = booking.confirmed_scheduled_at ?? booking.task?.scheduled_at;
  const price = booking.price ?? booking.task?.budget ?? null;
  return (
    <DividerSection>
      <Text className="text-heading font-display-bold text-primary-deep mb-md">
        {t('customer.bookings.sectionTaskSummary')}
      </Text>
      <View className="border-t border-border">
        <DetailRow
          icon={<FileText size={22} color={colors.textSecondary} />}
          label={t('customer.bookings.sectionTaskSummary')}
          body={booking.task?.description ?? t('customer.bookings.taskDescriptionUnavailable')}
        />
        <View className="border-t border-border">
          <DetailRow
            icon={<CalendarClock size={22} color={colors.textSecondary} />}
            label={t('customer.bookings.sectionSchedule')}
            body={formatDateTime(scheduledAt) || t('customer.bookings.scheduleUnavailable')}
            testID="booking-detail-schedule-section"
          />
        </View>
        <View className="border-t border-border">
          <DetailRow
            icon={<MapPin size={22} color={colors.textSecondary} />}
            label={t('customer.bookings.sectionLocation')}
            body={booking.task?.location_text ?? t('customer.bookings.locationUnavailable')}
            note={t('customer.bookings.exactAddressVisible')}
            testID="booking-detail-address-section"
          />
        </View>
        <View className="border-t border-border">
          <DetailRow
            icon={<Banknote size={22} color={colors.textSecondary} />}
            label={t('customer.bookings.sectionPricing')}
            body={<PriceTag amount={price} size="sm" className="text-primary-deep" />}
            testID="booking-detail-pricing-section"
          />
        </View>
      </View>
    </DividerSection>
  );
}

export function PaymentNote() {
  const { t } = useTranslation();
  return (
    <DividerSection testID="booking-detail-payment-note">
      <DetailRow
        icon={<Banknote size={22} color={colors.sunLight} />}
        label={t('customer.bookings.paymentNoteHeading')}
        body={t('customer.bookings.paymentNote')}
        note={t('customer.bookings.directSettlementNote')}
      />
    </DividerSection>
  );
}
