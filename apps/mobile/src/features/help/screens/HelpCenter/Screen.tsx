import React from 'react';
import { View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '@/components/shells';
import { mobileTheme } from '@/design/tokenAdapter';

import { CategorySection } from './FaqList';
import { HelpSearchBar } from './SearchBar';
import { HelpErrorState, HelpLoading } from './States';
import { useHelpCenterScreen } from './useHelpCenterScreen';

const { spacing } = mobileTheme;

export default function HelpCenterScreen() {
  const {
    t,
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
    <ScreenContainer testID="help-screen" edges={['left', 'right']}>
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
