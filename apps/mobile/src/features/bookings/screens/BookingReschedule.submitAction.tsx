import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, CalendarRange } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { StickyActionBar } from '@/components/shells';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

import { RESCHEDULE_SURFACE, type RescheduleState } from './BookingReschedule.model';

const { colors, spacing, typography } = mobileTheme;

interface RequestStateCardProps {
  requestState: RescheduleState;
}

export function RequestStateCard({ requestState }: RequestStateCardProps) {
  const { t } = useTranslation();
  if (requestState === 'request_form') return null;

  return (
    <View className="bg-muted rounded-lg p-lg gap-sm items-start">
      <View
        className="rounded-md bg-card items-center justify-center"
        style={{
          width: RESCHEDULE_SURFACE.stateIconBox,
          height: RESCHEDULE_SURFACE.stateIconBox,
        }}
      >
        <CalendarRange size={20} color={colors.secondary} />
      </View>
      <Text className="text-body font-sans-bold text-primary-deep">
        {requestState === 'awaiting_response'
          ? t('customer.bookings.statusAwaiting')
          : requestState === 'accepted'
            ? t('customer.bookings.statusAccepted')
            : requestState === 'declined'
              ? t('customer.bookings.statusDeclined')
              : t('customer.bookings.statusExpired')}
      </Text>
      <Text
        className="text-label text-text-secondary"
        style={{ lineHeight: typography.label * 1.5 }}
      >
        {requestState === 'awaiting_response'
          ? t('customer.bookings.awaitingMessage')
          : requestState === 'accepted'
            ? t('customer.bookings.acceptedMessage')
            : requestState === 'declined'
              ? t('customer.bookings.declinedMessage')
              : t('customer.bookings.expiredMessage')}
      </Text>
    </View>
  );
}

interface SubmitButtonProps {
  isPending: boolean;
  onSubmit: () => void;
}

export function SubmitButton({ isPending, onSubmit }: SubmitButtonProps) {
  const { t } = useTranslation();
  return (
    <StickyActionBar>
      <View className="pt-md pb-lg px-lg">
        <Touchable
          accessibilityRole="button"
          onPress={() => void onSubmit()}
          className="rounded-md overflow-hidden"
          testID="reschedule-screen-next"
          disabled={isPending}
        >
          <LinearGradient
            colors={[colors.primaryDeep, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              {
                minHeight: RESCHEDULE_SURFACE.ctaHeight,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
              },
              isPending && { opacity: 0.7 },
            ]}
          >
            <Text className="text-body font-sans-bold text-primary-foreground">
              {t('customer.bookings.ctaSubmitReschedule')}
            </Text>
            <ArrowRight size={20} color={colors.primaryForeground} />
          </LinearGradient>
        </Touchable>
      </View>
    </StickyActionBar>
  );
}
