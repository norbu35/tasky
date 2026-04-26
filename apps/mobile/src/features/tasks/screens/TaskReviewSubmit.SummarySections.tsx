import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';

import {
  summarizeIntakeAnswers,
  type IntakeAnswerSummaryItem,
  type IntakeSchema,
} from '@tasky/core';

import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme, elevations } from '@/design/tokenAdapter';

import { buildFallbackAnswerSummary, isImageUri } from './TaskReviewSubmit.model';

const { colors } = mobileTheme;

interface SectionCardProps {
  label: string;
  value: string;
  onEdit?: () => void;
  testID?: string;
  icon?: React.ReactNode;
  featured?: boolean;
  children?: React.ReactNode;
}

export function SectionCard({
  label,
  value,
  onEdit,
  testID,
  icon,
  featured = false,
  children,
}: SectionCardProps) {
  const { t } = useTranslation();

  return (
    <View
      testID={testID}
      className={`rounded-sm p-lg mb-md gap-sm${featured ? ' bg-primary-deep rounded-lg' : ' bg-muted'}`}
      style={featured ? elevations.soft : undefined}
    >
      <View className="flex-row justify-between items-center">
        <Text
          className={`text-caption font-bold${featured ? ' text-primary-foreground/80' : ' text-text-secondary'}`}
        >
          {label}
        </Text>
        {onEdit ? (
          <Touchable
            onPress={onEdit}
            accessibilityRole="button"
            testID={testID ? `${testID}-edit` : 'review-section-edit'}
          >
            <Text
              className={`text-caption font-bold${featured ? ' text-accent' : ' text-primary-deep'}`}
            >
              {t('ReviewSubmitScreen.edit')}
            </Text>
          </Touchable>
        ) : null}
      </View>

      <View className="flex-row items-center gap-sm">
        {icon ? (
          <View
            className="w-7 h-7 rounded-md items-center justify-center"
            style={{
              backgroundColor: featured ? `${colors.primaryForeground}1F` : `${colors.primary}14`,
            }}
          >
            {icon}
          </View>
        ) : null}
        <Text
          className={`flex-1 text-body font-bold leading-snug${featured ? ' text-primary-foreground text-[36px] font-display-bold leading-[40px]' : ' text-foreground'}`}
        >
          {value}
        </Text>
      </View>
      {children}
    </View>
  );
}

interface PhotosCardProps {
  photos: string[];
  onEdit: () => void;
}

export function PhotosCard({ photos, onEdit }: PhotosCardProps) {
  const { t } = useTranslation();
  const slots = photos.slice(0, 3);

  return (
    <View className="bg-muted rounded-sm p-lg mb-md gap-sm" testID="review-section-photos">
      <View className="flex-row justify-between items-center">
        <Text className="text-caption font-bold text-text-secondary">
          {t('ReviewSubmitScreen.sectionPhotos')} {photos.length > 0 ? `(${photos.length})` : ''}
        </Text>
        <Touchable onPress={onEdit} accessibilityRole="button" testID="review-section-photos-edit">
          <Text className="text-caption font-bold text-primary-deep">
            {t('ReviewSubmitScreen.edit')}
          </Text>
        </Touchable>
      </View>

      <View className="flex-row gap-sm">
        {slots.map((photo, index) => (
          <View
            key={`${photo}-${index}`}
            className="w-32 h-32 rounded-md overflow-hidden bg-muted items-center justify-center"
          >
            {isImageUri(photo) ? (
              <Image source={{ uri: photo }} className="self-stretch h-full" />
            ) : (
              <Text className="text-caption font-bold text-primary-deep">{String(index + 1)}</Text>
            )}
          </View>
        ))}
        {Array.from({ length: Math.max(0, 3 - slots.length) }).map((_, idx) => (
          <View
            key={`empty-${idx}`}
            className="w-32 h-32 rounded-md overflow-hidden items-center justify-center border-2 border-dashed border-chip-inactive bg-card"
          >
            <Text className="text-heading text-text-secondary leading-[24px]">+</Text>
          </View>
        ))}
      </View>

      {photos.length === 0 ? (
        <Text className="text-caption text-text-secondary">{t('ReviewSubmitScreen.noPhotos')}</Text>
      ) : null}
    </View>
  );
}

interface IntakeAnswersSummaryProps {
  answers: Record<string, unknown>;
  schema: IntakeSchema | null;
}

export function IntakeAnswersSummary({ answers, schema }: IntakeAnswersSummaryProps) {
  const { t, i18n } = useTranslation();
  const summaryItems = useMemo(() => {
    if (schema) {
      return summarizeIntakeAnswers(schema, answers, {
        locale: i18n.language === 'mn' ? 'mn' : 'en',
        yesLabel: t('common.yes'),
        noLabel: t('common.no'),
      });
    }

    return buildFallbackAnswerSummary(answers, t);
  }, [answers, i18n.language, schema, t]);

  if (summaryItems.length === 0) {
    return null;
  }

  return (
    <View className="mt-sm gap-sm">
      {summaryItems.map((item: IntakeAnswerSummaryItem) => (
        <View key={item.key} className="gap-xs">
          <Text className="text-caption font-bold text-text-secondary">{item.label}</Text>
          <View className="flex-row flex-wrap gap-xs">
            {item.values.map((value: string, index: number) => (
              <View key={`${item.key}-${index}`} className="px-md py-sm rounded-sm bg-card">
                <Text className="text-label font-bold text-foreground">{value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

interface DescriptionCardProps {
  description: string;
  shortDescription: string;
  showFull: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

export function DescriptionCard({
  description,
  shortDescription,
  showFull,
  onToggle,
  onEdit,
}: DescriptionCardProps) {
  const { t } = useTranslation();

  return (
    <View className="bg-muted rounded-sm p-lg mb-md gap-sm" testID="review-section-description">
      <View className="flex-row justify-between items-center">
        <Text className="text-caption font-bold text-text-secondary">
          {t('ReviewSubmitScreen.sectionDetails')}
        </Text>
        <Touchable
          onPress={onEdit}
          accessibilityRole="button"
          testID="review-section-description-edit"
        >
          <Text className="text-caption font-bold text-primary-deep">
            {t('ReviewSubmitScreen.edit')}
          </Text>
        </Touchable>
      </View>
      <Text className="text-body text-foreground leading-loose">
        {showFull ? description : shortDescription}
      </Text>
      {description.length > 140 ? (
        <Touchable
          onPress={onToggle}
          accessibilityRole="button"
          testID="review-section-description-toggle"
        >
          <Text className="text-caption font-bold text-accent">
            {showFull ? t('ReviewSubmitScreen.viewLess') : t('ReviewSubmitScreen.viewMore')}
          </Text>
        </Touchable>
      ) : null}
    </View>
  );
}
