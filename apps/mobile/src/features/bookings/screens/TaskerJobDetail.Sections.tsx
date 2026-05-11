import { Banknote, CalendarClock, CheckCircle, FileText, MapPin } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { mobileTheme } from '@/design/tokenAdapter';
import type { Booking } from '@/lib/api/types';
import { formatDateTime } from '@/utils/formatDate';

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

interface TaskerJobDetailSectionsProps {
  booking: Booking;
  showExactAddress: boolean;
}

export function TaskerJobDetailSections({
  booking,
  showExactAddress,
}: TaskerJobDetailSectionsProps) {
  const { t } = useTranslation();
  const scheduledAt = booking.confirmed_scheduled_at ?? booking.task?.scheduled_at;
  const price = booking.price ?? booking.task?.budget ?? null;

  return (
    <>
      <DividerSection>
        <Text className="text-heading font-display-bold text-primary-deep mb-md">
          {t('tasker.jobs.customerLabel')}
        </Text>
        <View className="flex-row items-center py-sm" style={{ gap: spacing.md }}>
          <ProfileAvatar
            uri={booking.customer?.avatar_url}
            name={booking.customer?.full_name}
            size="lg"
          />
          <View className="flex-1">
            <Text className="text-subtitle font-sans-bold text-primary-deep">
              {booking.customer?.full_name ?? ''}
            </Text>
            <View className="flex-row items-center mt-xs" style={{ gap: spacing.xs }}>
              <CheckCircle size={16} color={colors.verified} />
              <Text className="text-caption text-text-secondary">
                {t('tasker.jobs.platformContactNote')}
              </Text>
            </View>
          </View>
        </View>
      </DividerSection>

      <DividerSection>
        <Text className="text-heading font-display-bold text-primary-deep mb-md">
          {t('tasker.jobs.taskDescription')}
        </Text>
        <View className="border-t border-border">
          <DetailRow
            icon={<FileText size={22} color={colors.textSecondary} />}
            label={t('tasker.jobs.taskDescription')}
            body={booking.task?.description ?? ''}
          />
          {showExactAddress ? (
            <View className="border-t border-border">
              <DetailRow
                icon={<MapPin size={22} color={colors.textSecondary} />}
                label={t('tasker.jobs.exactAddress')}
                body={booking.task?.location_text ?? ''}
                note={t('tasker.jobs.exactAddressNote')}
                testID="booking-detail-tasker-address-section"
              />
            </View>
          ) : null}
          <View className="border-t border-border">
            <DetailRow
              icon={<CalendarClock size={22} color={colors.textSecondary} />}
              label={t('tasker.jobs.schedule')}
              body={formatDateTime(scheduledAt)}
            />
          </View>
          <View className="border-t border-border">
            <DetailRow
              icon={<Banknote size={22} color={colors.textSecondary} />}
              label={t('tasker.jobs.budget')}
              body={<PriceTag amount={price} size="sm" className="text-primary-deep" />}
            />
          </View>
        </View>
      </DividerSection>

      <DividerSection testID="booking-detail-tasker-payment-note">
        <DetailRow
          icon={<Banknote size={22} color={colors.sunLight} />}
          label={t('tasker.jobs.paymentNoteHeading')}
          body={t('BookingDetailTaskerScreen.copy1')}
          note={t('tasker.jobs.directSettlementNote')}
        />
      </DividerSection>
    </>
  );
}
