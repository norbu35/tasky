import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../components/templates/FormWizardTemplate';
import { ProfileAvatar } from '../../components/ui/ProfileAvatar';
import { useCreateTask } from '../../features/tasks/hooks/useCreateTask';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function RebookScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<{
        taskerId: string;
        taskerName: string;
        taskerAvatar: string;
        categoryId: string;
        categoryName: string;
        description: string;
        budget: string;
        locationLat: string;
        locationLng: string;
        locationText: string;
        scheduledAt: string;
    }>();

    const { mutateAsync: createTask, isPending } = useCreateTask();

    // Default new schedule to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const [budget, setBudget] = useState(params.budget ?? '50000');
    const [selectedDate] = useState<Date>(tomorrow);

    const handleSubmit = useCallback(async () => {
        const task = await createTask({
            category_id: params.categoryId,
            description: params.description,
            budget: Number(budget),
            location_lat: Number(params.locationLat),
            location_lng: Number(params.locationLng),
            location_text: params.locationText,
            scheduled_at: selectedDate.toISOString(),
        });
        router.push({
            pathname: '/(customer)/bookings/confirm',
            params: {
                taskId: task.id,
                applicationId: '',
                taskerId: params.taskerId,
                taskTitle: params.description,
                taskBudget: budget,
                taskSchedule: selectedDate.toISOString(),
                taskerName: params.taskerName,
                taskerAvatar: params.taskerAvatar,
            },
        });
    }, [params, budget, selectedDate, createTask, router]);

    return (
        <FormWizardTemplate
            currentStep={0}
            totalSteps={1}
            onNext={handleSubmit}
            onBack={() => router.back()}
            nextLabel={t('customer.bookings.ctaRebookSubmit', 'Continue to Booking')}
            nextLoading={isPending}
            showBack={false}
            testID="rebook-screen"
        >
            {/* Prefilled Note */}
            <Text style={styles.prefilledNote}>
                {t(
                    'customer.bookings.prefilledNote',
                    'Prefilled from previous booking. You can edit.'
                )}
            </Text>

            {/* Tasker Info Card */}
            <View style={styles.taskerCard}>
                <Text style={styles.sectionTitle}>
                    {t('customer.bookings.sectionPreviousTasker', 'Previous Tasker')}
                </Text>
                <View style={styles.taskerRow}>
                    <ProfileAvatar
                        uri={params.taskerAvatar}
                        name={params.taskerName}
                        size="lg"
                        showVerified
                    />
                    <View style={styles.taskerInfo}>
                        <Text style={styles.taskerName}>{params.taskerName}</Text>
                    </View>
                </View>
            </View>

            {/* Task Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('customer.bookings.sectionTaskDetails', 'Task Details')}
                </Text>
                <Text style={styles.categoryName}>{params.categoryName}</Text>
                <Text style={styles.description}>{params.description}</Text>
                {params.locationText && (
                    <Text style={styles.detailText}>{params.locationText}</Text>
                )}
            </View>

            {/* Schedule */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('customer.bookings.labelNewSchedule', 'New Schedule')}
                </Text>
                <Pressable style={styles.datePicker} testID="rebook-screen-date-picker">
                    <Text style={styles.dateText}>
                        {selectedDate.toLocaleDateString()} {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </Pressable>
            </View>

            {/* Budget */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('customer.bookings.labelBudget', 'Budget')}
                </Text>
                <TextInput
                    style={styles.budgetInput}
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="numeric"
                    maxLength={10}
                    testID="rebook-screen-budget"
                />
            </View>
        </FormWizardTemplate>
    );
}

const styles = StyleSheet.create({
    prefilledNote: {
        fontSize: typography.caption,
        color: colors.accent,
        fontStyle: 'italic',
        marginBottom: spacing.md,
    },
    taskerCard: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.subtitle,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: spacing.md,
    },
    taskerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    taskerInfo: {
        flex: 1,
    },
    taskerName: {
        fontSize: typography.body,
        fontWeight: '600',
        color: colors.primaryDeep,
    },
    section: {
        marginBottom: spacing.xl,
    },
    categoryName: {
        fontSize: typography.body,
        fontWeight: '600',
        color: colors.primaryDeep,
        marginBottom: spacing.xs,
    },
    description: {
        fontSize: typography.body,
        color: colors.primaryDeep,
        marginBottom: spacing.sm,
    },
    detailText: {
        fontSize: typography.caption,
        color: colors.textSecondary,
    },
    datePicker: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        backgroundColor: colors.card,
    },
    dateText: {
        fontSize: typography.body,
        color: colors.primaryDeep,
    },
    budgetInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        fontSize: typography.body,
        color: colors.primaryDeep,
        backgroundColor: colors.card,
    },
});
