import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { Button } from '@/components/ui/Button';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import { ApplicantCard } from './ApplicantsSelection.ApplicantCard';
import { ConfirmationSheet } from './ApplicantsSelection.ConfirmationSheet';
import { useApplicantsSelection } from './useApplicantsSelection';

const { colors, spacing } = mobileTheme;
const { tint } = mobileSurfaces;

export default function ApplicantsSelectionScreen() {
  const { t } = useTranslation();
  const {
    applicants,
    isLoading,
    isError,
    refetch,
    selectedApplicant,
    declineNotification,
    setDeclineNotification,
    handleAccept,
    handleConfirmAccept,
    handleViewProfile,
    dismissSheet,
    goBack,
  } = useApplicantsSelection();

  return (
    <>
      <ScreenContainer testID="applicants-list-screen">
        <View className="flex-row items-center px-lg pt-lg pb-md" style={{ gap: spacing.md }}>
          <Touchable
            onPress={goBack}
            className="flex-row items-center"
            testID="applicants-list-back"
            accessibilityRole="button"
            style={{ gap: spacing.xs }}
          >
            <ChevronLeft size={20} color={colors.primary} />
            <Text className="text-body font-sans-semibold text-primary">{t('common.back')}</Text>
          </Touchable>
          <View className="flex-1" style={{ gap: spacing.xs / 2 }}>
            <Text className="text-heading font-sans-bold text-primary-deep">
              {t('customer.applicants.pageTitle')}
            </Text>
            <Text className="text-caption text-text-secondary">
              {t('customer.applicants.count').replace('{{count}}', String(applicants.length))}
            </Text>
          </View>
        </View>

        {declineNotification ? (
          <View
            testID="SCR-CUST-012"
            className="flex-row items-center justify-between mx-lg mb-sm p-md rounded-md"
            style={{ backgroundColor: tint.dangerSoft }}
          >
            <Text className="flex-1 text-caption font-sans-semibold text-danger leading-snug">
              {declineNotification}
            </Text>
            <Button
              label={t('common.dismiss')}
              variant="ghost"
              onPress={() => setDeclineNotification(null)}
            />
          </View>
        ) : null}

        {isLoading ? (
          <View
            className="mx-lg rounded-lg bg-card p-lg"
            style={{ gap: spacing.sm, ...elevations.soft }}
          >
            <Text className="text-body text-text-secondary">{t('common.loading')}</Text>
          </View>
        ) : isError ? (
          <View
            className="mx-lg rounded-lg bg-card p-lg"
            style={{ gap: spacing.md, ...elevations.soft }}
          >
            <Text className="text-body font-sans-semibold text-danger">
              {t('customer.applicants.errorTitle')}
            </Text>
            <Text className="text-label text-text-secondary">
              {t('customer.applicants.errorBody')}
            </Text>
            <Button label={t('common.retry')} onPress={() => refetch()} />
          </View>
        ) : applicants.length === 0 ? (
          <View className="flex-1 items-center justify-center px-2xl" style={{ gap: spacing.md }}>
            <Text className="text-title font-sans-bold text-primary-deep">
              {t('customer.applicants.emptyTitle')}
            </Text>
            <Text className="text-body text-text-secondary text-center">
              {t('customer.applicants.emptyDescription')}
            </Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'] }}
            data={applicants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ marginBottom: spacing.md }}>
                <ApplicantCard
                  applicant={item}
                  onAccept={handleAccept}
                  onViewProfile={handleViewProfile}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScreenContainer>

      <ConfirmationSheet
        selectedApplicant={selectedApplicant}
        isOpen={!!selectedApplicant}
        onClose={dismissSheet}
        onConfirm={handleConfirmAccept}
      />
    </>
  );
}
