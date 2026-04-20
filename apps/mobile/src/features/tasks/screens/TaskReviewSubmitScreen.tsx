import { CalendarDays, CircleAlert, CircleDollarSign, MapPin, Sparkles } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { Toast } from '@/components/ui/Toast';
import { mobileTheme } from '@/design/tokenAdapter';

import { formatBudget, formatSchedule } from './TaskReviewSubmit.model';
import {
  SectionCard,
  PhotosCard,
  IntakeAnswersSummary,
  DescriptionCard,
} from './TaskReviewSubmit.parts';
import { useTaskReviewSubmit } from './useTaskReviewSubmit';

const { colors } = mobileTheme;

export default function TaskReviewSubmitScreen() {
  const { t } = useTranslation();
  const {
    draft,
    intakeSchema,
    isValid,
    isSubmitting,
    error,
    showFullDescription,
    toggleDescription,
    submit,
    goBack,
    navigateToCategory,
    navigateToIntake,
    navigateToPhotos,
    navigateToLocation,
    navigateToSchedule,
  } = useTaskReviewSubmit();

  return (
    <FormWizardTemplate
      currentStep={5}
      totalSteps={7}
      onNext={submit}
      onBack={goBack}
      nextLabel={t('ReviewSubmitScreen.postButton')}
      nextLoading={isSubmitting}
      nextDisabled={isSubmitting || !isValid}
      testID="SCR-CUST-007"
      nextButtonTestID="SCR-CUST-007-cta"
    >
      <View className="gap-xs mb-sm">
        <Text className="text-caption font-bold text-text-secondary uppercase tracking-[0.075em]">
          {t('ReviewSubmitScreen.finalStep')}
        </Text>
        <Text className="text-heading font-display-bold text-primary-deep">
          {t('ReviewSubmitScreen.reviewTitle')}
        </Text>
      </View>

      <SectionCard
        label={t('ReviewSubmitScreen.sectionCategory')}
        value={draft.categoryName || draft.categoryId}
        onEdit={navigateToCategory}
        testID="review-section-category"
        icon={<Sparkles size={16} color={colors.primaryDeep} />}
      />

      <SectionCard
        label={t('ReviewSubmitScreen.sectionScope')}
        value={draft.description}
        onEdit={navigateToIntake}
        testID="review-section-title"
      >
        <IntakeAnswersSummary answers={draft.intakeAnswers} schema={intakeSchema} />
      </SectionCard>

      <DescriptionCard
        description={draft.description}
        shortDescription={draft.shortDescription}
        showFull={showFullDescription}
        onToggle={toggleDescription}
        onEdit={navigateToIntake}
      />

      <PhotosCard photos={draft.photos} onEdit={navigateToPhotos} />

      <SectionCard
        label={t('ReviewSubmitScreen.sectionLocation')}
        value={draft.locationText || t('ReviewSubmitScreen.notSet')}
        onEdit={navigateToLocation}
        testID="review-section-location"
        icon={<MapPin size={16} color={colors.accent} />}
      />

      <SectionCard
        label={t('ReviewSubmitScreen.sectionSchedule')}
        value={formatSchedule(draft.scheduledAt) || t('ReviewSubmitScreen.flexibleSchedule')}
        onEdit={navigateToSchedule}
        testID="review-section-schedule"
        icon={<CalendarDays size={16} color={colors.primaryDeep} />}
      />

      <SectionCard
        label={t('ReviewSubmitScreen.sectionBudget')}
        value={formatBudget(draft.budget || '0')}
        onEdit={navigateToSchedule}
        testID="review-section-budget"
        icon={<CircleDollarSign size={16} color={colors.accent} />}
      />

      <View className="rounded-md bg-muted p-md flex-row items-start gap-sm mb-sm">
        <CircleAlert size={16} color={colors.accent} />
        <Text className="flex-1 text-caption leading-relaxed text-text-secondary">
          {t('ReviewSubmitScreen.reviewGuidance')}
        </Text>
      </View>

      {error ? (
        <View className="rounded-md mb-md" testID="review-submit-error">
          <Toast message={error} variant="error" />
        </View>
      ) : null}
    </FormWizardTemplate>
  );
}
