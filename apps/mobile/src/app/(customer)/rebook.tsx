import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../components/templates/FormWizardTemplate';
import { Input } from '../../components/ui/Input';
import { ProfileAvatar } from '../../components/ui/ProfileAvatar';
import { useCreateTask } from '../../features/tasks/hooks/useCreateTask';
import { useCreateBookingIntent } from '../../features/bookings/hooks/useCreateBookingIntent';
import { elevations } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

function formatDateTime(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  const h = String(value.getHours()).padStart(2, '0');
  const min = String(value.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

export default function RebookScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
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
  const { mutateAsync: createBookingIntent, isPending: isCreatingBookingIntent } =
    useCreateBookingIntent();

  const [budget, setBudget] = useState(params.budget ?? '50000');
  const [selectedDate] = useState<Date>(() => {
    if (params.scheduledAt) {
      return new Date(params.scheduledAt);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  });

  const numericBudget = Number(budget);
  const budgetTooLow = Number.isFinite(numericBudget) && numericBudget <= 1001;

  const handleSubmit = useCallback(async () => {
    if (budgetTooLow) return;
    const task = await createTask({
      category_id: params.categoryId,
      description: params.description,
      budget: numericBudget,
      intake_answers: { description: params.description },
      intake_schema_version: 1,
      location_lat: Number(params.locationLat),
      location_lng: Number(params.locationLng),
      location_text: params.locationText,
      photo_keys: [],
      scheduled_at: selectedDate.toISOString(),
    });
    const bookingIntent = await createBookingIntent({
      taskId: task.id,
      source: 'REBOOK',
      taskerId: params.taskerId,
      originalBookingId: params.bookingId,
    });
    router.push({
      pathname: '/(customer)/bookings/confirm',
      params: {
        taskId: task.id,
        source: 'rebook',
        bookingIntentId: bookingIntent.id,
        taskerId: params.taskerId,
        taskTitle: params.description,
        taskBudget: budget,
        taskSchedule: selectedDate.toISOString(),
        taskerName: params.taskerName,
        taskerAvatar: params.taskerAvatar,
      },
    });
  }, [
    params,
    budget,
    budgetTooLow,
    numericBudget,
    selectedDate,
    createTask,
    createBookingIntent,
    router,
  ]);

  return (
    <FormWizardTemplate
      testID="SCR-CUST-023"
      currentStep={0}
      totalSteps={1}
      onNext={handleSubmit}
      onBack={() => router.back()}
      nextLabel={t('customer.bookings.ctaRebookSubmit')}
      nextDisabled={budgetTooLow}
      nextLoading={isPending || isCreatingBookingIntent}
      showBack
    >
      {/* Prefilled Note */}
      <Text className="text-caption text-accent italic mb-item">
        {t('customer.bookings.prefilledNote')}
      </Text>

      {/* Tasker Info Card */}
      <View className="mb-section bg-muted rounded-md p-card" style={elevations.soft}>
        <Text className="text-screen-section-title font-sans-bold text-primaryDeep mb-item">
          {t('customer.bookings.sectionPreviousTasker')}
        </Text>
        <View className="flex-row items-center gap-md">
          <ProfileAvatar
            uri={params.taskerAvatar}
            name={params.taskerName}
            size="lg"
            showVerified
          />
          <View className="flex-1">
            <Text className="text-body font-semibold text-primaryDeep">{params.taskerName}</Text>
          </View>
        </View>
      </View>

      {/* Task Details */}
      <View className="mb-section">
        <Text className="text-screen-section-title font-sans-bold text-primaryDeep mb-item">
          {t('customer.bookings.sectionTaskDetails')}
        </Text>
        <Text className="text-body font-semibold text-primaryDeep mb-xs">{params.categoryName}</Text>
        <Text className="text-body text-primaryDeep mb-sm">{params.description}</Text>
        {params.locationText && (
          <Text className="text-caption text-textSecondary">{params.locationText}</Text>
        )}
      </View>

      {/* Schedule */}
      <View className="mb-section">
        <Text className="text-screen-section-title font-sans-bold text-primaryDeep mb-item">
          {t('customer.bookings.labelNewSchedule')}
        </Text>
        <Pressable className="rounded-md p-card bg-muted" testID="rebook-screen-date-picker">
          <Text className="text-body text-primaryDeep">{formatDateTime(selectedDate)}</Text>
        </Pressable>
      </View>

      {/* Budget */}
      <View className="mb-section">
        <Text className="text-screen-section-title font-sans-bold text-primaryDeep mb-item">
          {t('customer.bookings.labelBudget')}
        </Text>
        <Input
          className="rounded-md bg-muted"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
          maxLength={10}
          testID="rebook-screen-budget"
        />
        {budgetTooLow ? (
          <Text className="text-caption text-danger mt-xs">
            {t('customer.bookings.rebookBudgetLow')}
          </Text>
        ) : null}
      </View>
    </FormWizardTemplate>
  );
}
