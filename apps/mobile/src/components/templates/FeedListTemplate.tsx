import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { animationPresets } from '../../design/animations';
import { screenLayout } from '../../design/screenLayout';
import { mobileTheme } from '../../design/tokenAdapter';
import { ScreenContainer } from '../shells/ScreenContainer';
import { Reveal } from '../ui/Reveal';

import { EmptyStateTemplate } from './EmptyStateTemplate';
import { ErrorStateTemplate } from './ErrorStateTemplate';

const { colors } = mobileTheme;

export interface FeedListTemplateProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onRetry?: () => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCtaLabel?: string;
  emptyCtaOnPress?: () => void;
  errorMessage?: string;
  retryLabel?: string;
  filterBar?: React.ReactNode;
  ListHeaderComponent?: React.ReactElement;
  testID?: string;
  className?: string;
}

function SkeletonCard() {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, {
        duration: animationPresets.skeleton.duration,
        easing: animationPresets.skeleton.easing,
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className="bg-muted rounded-md gap-sm"
      style={[animatedStyle, { padding: screenLayout.body.cardPadding }]}
    >
      <View className="h-lg bg-chip-inactive rounded-xs self-stretch" />
      <View className="h-md bg-chip-inactive rounded-xs" style={{ width: '60%' }} />
      <View className="h-md bg-chip-inactive rounded-xs" style={{ width: '80%' }} />
    </Animated.View>
  );
}

function ItemSeparator() {
  return <View className="h-item" />;
}

export function FeedListTemplate<T>({
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  isError = false,
  isEmpty = false,
  onRefresh,
  isRefreshing = false,
  onRetry,
  onEndReached,
  isLoadingMore = false,
  emptyTitle,
  emptyDescription,
  emptyCtaLabel,
  emptyCtaOnPress,
  errorMessage,
  retryLabel,
  filterBar,
  ListHeaderComponent,
  testID,
  className,
}: FeedListTemplateProps<T>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const renderListItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <Reveal delay={Math.min(index * 35, 180)}>{renderItem(item, index)}</Reveal>
    ),
    [renderItem],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-xl items-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  const combinedHeader =
    ListHeaderComponent || filterBar ? (
      <View className="pb-md gap-sm">
        {ListHeaderComponent ? <Reveal delay={20}>{ListHeaderComponent}</Reveal> : null}
        {filterBar ? <Reveal delay={60}>{filterBar}</Reveal> : null}
      </View>
    ) : null;

  if (isLoading) {
    return (
      <ScreenContainer className={className} testID={testID}>
        {combinedHeader}
        <View>
          {Array.from({ length: 5 }).map((_, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ItemSeparator />}
              <SkeletonCard />
            </React.Fragment>
          ))}
        </View>
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer className={className} testID={testID}>
        {combinedHeader}
        <ErrorStateTemplate
          message={errorMessage ?? t('feed.errorMessage')}
          onRetry={onRetry}
          retryLabel={retryLabel}
          testID={testID ? `${testID}-error` : undefined}
        />
      </ScreenContainer>
    );
  }

  if (isEmpty || data.length === 0) {
    return (
      <ScreenContainer className={className} testID={testID}>
        {combinedHeader}
        <EmptyStateTemplate
          title={emptyTitle ?? t('feed.emptyTitle')}
          description={emptyDescription}
          ctaLabel={emptyCtaLabel}
          ctaOnPress={emptyCtaOnPress}
          testID={testID ? `${testID}-empty` : undefined}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className={className} testID={testID}>
      <FlatList
        style={{ flex: 1 }}
        data={data}
        renderItem={renderListItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingBottom: screenLayout.chrome.contentBottomClearance + insets.bottom,
        }}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={combinedHeader}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.8}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
