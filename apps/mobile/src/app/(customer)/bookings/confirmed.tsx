import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SuccessCelebrationTemplate } from '../../../components/templates/SuccessCelebrationTemplate';

export default function BookingConfirmedScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

    const handleViewBooking = () => {
        router.replace(`/(customer)/bookings/${bookingId}`);
    };

    const handleDone = () => {
        router.replace('/(customer)/bookings');
    };

    return (
        <SuccessCelebrationTemplate
            headline={t('customer.bookings.confirmedHeadline', 'Booking confirmed!')}
            body={t(
                'customer.bookings.confirmedNextSteps',
                'Your Tasker will arrive at the scheduled time. You can contact them via chat.'
            )}
            ctaLabel={t('customer.bookings.ctaViewBooking', 'View Booking')}
            ctaOnPress={handleViewBooking}
            secondaryCtaLabel={t('customer.bookings.ctaDone', 'Done')}
            secondaryCtaOnPress={handleDone}
            testID="booking-confirmed-screen"
        />
    );
}
