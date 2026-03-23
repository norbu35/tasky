import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { useBookingTimeline } from '../../../../features/bookings/hooks/useBookingTimeline';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

const EVENT_LABELS: Record<string, string> = {
    booking_created: 'Booking created',
    tasker_assigned: 'Tasker assigned',
    reschedule_requested: 'Reschedule requested',
    reschedule_accepted: 'Reschedule accepted',
    reschedule_declined: 'Reschedule declined',
    reschedule_expired: 'Reschedule request expired',
    tasker_marked_done: 'Tasker marked as done',
    customer_confirmed: 'Customer confirmed completion',
    cancelled: 'Booking cancelled',
    no_show: 'Flagged as no-show',
};

function formatEventLabel(event: string): string {
    return EVENT_LABELS[event] ?? event.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(ts: string): string {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${day} ${h}:${min}`;
}

export default function BookingTimelineScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const { data: events, isLoading, isError, refetch } = useBookingTimeline(bookingId);

    const timelineEvents = events ?? [];

    return (
        <DetailTemplate
            headerTitle={t('customer.bookings.timelineTitle', 'Booking Timeline')}
            onBack={() => router.back()}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            testID="booking-timeline-screen"
        >
            <View style={styles.timeline}>
                {timelineEvents.map((event: any, index: number) => {
                    const isLast = index === timelineEvents.length - 1;
                    const isPast = !isLast;
                    const stateLabel = isLast ? 'active' : 'past';

                    return (
                        <View
                            key={index}
                            style={styles.eventRow}
                            testID={`timeline-event-${index}-${stateLabel}`}
                        >
                            {/* Connector */}
                            <View style={styles.connectorColumn}>
                                <View
                                    style={[
                                        styles.dot,
                                        isLast ? styles.dotActive : styles.dotPast,
                                    ]}
                                />
                                {!isLast && <View style={styles.line} />}
                            </View>

                            {/* Content */}
                            <View style={styles.eventContent}>
                                <Text
                                    style={[
                                        styles.eventLabel,
                                        isLast && styles.eventLabelActive,
                                    ]}
                                >
                                    {formatEventLabel(event.event)}
                                </Text>
                                <Text style={styles.eventTimestamp}>
                                    {formatTimestamp(event.timestamp)}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </DetailTemplate>
    );
}

const styles = StyleSheet.create({
    timeline: {
        paddingVertical: spacing.md,
    },
    eventRow: {
        flexDirection: 'row',
        minHeight: 60,
    },
    connectorColumn: {
        width: 32,
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    dotActive: {
        backgroundColor: colors.primary,
    },
    dotPast: {
        backgroundColor: colors.chipInactive,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: colors.chipInactive,
        marginVertical: 2,
    },
    eventContent: {
        flex: 1,
        paddingLeft: spacing.sm,
        paddingBottom: spacing.lg,
    },
    eventLabel: {
        fontSize: typography.body,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    eventLabelActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    eventTimestamp: {
        fontSize: typography.caption,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
});
