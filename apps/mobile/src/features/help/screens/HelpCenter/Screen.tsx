import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '@/components/shells';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

import { CategorySection } from './FaqList';
import { HelpSearchBar, SURFACE } from './SearchBar';
import { HelpErrorState, HelpLoading } from './States';
import { useHelpCenterScreen } from './useHelpCenterScreen';

const { colors, spacing } = mobileTheme;

export default function HelpCenterScreen() {
  const {
    t,
    router,
    state,
    query,
    setQuery,
    expandedId,
    visibleSections,
    handleToggle,
    handleRetry,
    searchPlaceholder,
  } = useHelpCenterScreen();

  return (
    <ScreenContainer testID="help-screen">
      <View
        className="flex-row items-center justify-between px-md"
        style={{ height: SURFACE.headerHeight }}
      >
        <Touchable
          onPress={() => router.back()}
          className="min-h-[44px] px-xs flex-row items-center gap-xs"
          hitSlop={spacing.sm}
          testID="help-screen-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
          <Text className="text-body font-sans-medium" style={{ color: colors.primary }}>
            {t('infra.help.backLabel')}
          </Text>
        </Touchable>
        <Text
          className="flex-1 text-subtitle font-sans-semibold text-center mx-sm"
          style={{ color: colors.primaryDeep }}
        >
          {t('infra.help.title')}
        </Text>
        <View
          style={{ width: spacing['3xl'], height: spacing['3xl'] }}
          className="justify-center items-center"
        />
      </View>

      {state === 'loading' ? (
        <HelpLoading searchPlaceholder={searchPlaceholder} />
      ) : state === 'error' ? (
        <HelpErrorState
          headline={t('infra.help.errorHeadline')}
          description={t('infra.help.errorDescription')}
          retryLabel={t('infra.help.errorRetry')}
          onRetry={handleRetry}
        />
      ) : (
        <View className="flex-1">
          <HelpSearchBar placeholder={searchPlaceholder} value={query} onChangeText={setQuery} />
          <InsetScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
            showsVerticalScrollIndicator={false}
            extraBottomInset={spacing.lg}
          >
            {visibleSections.map((section) => (
              <CategorySection
                key={section.id}
                section={section}
                expandedId={expandedId}
                onToggle={handleToggle}
              />
            ))}
          </InsetScrollView>
        </View>
      )}
    </ScreenContainer>
  );
}
