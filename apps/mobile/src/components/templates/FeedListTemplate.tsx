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

import { animationPresets } from '@/design/animations';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';

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
  StickyHeaderComponent?: React.ReactElement;
  SubHeaderComponent?: React.ReactElement;
  animateItems?: boolean;
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
    <Animated.View style={animatedStyle}>
      <View
        className="bg-muted rounded-md gap-sm"
        style={{ padding: screenLayout.body.cardPadding }}
      >
        <View className="h-lg bg-chip-inactive rounded-xs self-stretch" />
        <View className="h-md bg-chip-inactive rounded-xs" style={{ width: '60%' }} />
        <View className="h-md bg-chip-inactive rounded-xs" style={{ width: '80%' }} />
      </View>
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
  StickyHeaderComponent,
  SubHeaderComponent,
  animateItems = true,
  testID,
  className,
}: FeedListTemplateProps<T>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const extendedData = React.useMemo(() => {
    const items: any[] = [];
    if (StickyHeaderComponent) items.push({ __isStickyHeader: true });
    if (SubHeaderComponent) items.push({ __isSubHeader: true });
    return [...items, ...data];
  }, [data, StickyHeaderComponent, SubHeaderComponent]);

  const renderListItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (item.__isStickyHeader) {
        return <View className="z-50 bg-background">{StickyHeaderComponent}</View>;
      }
      if (item.__isSubHeader) {
        return <View>{SubHeaderComponent}</View>;
      }

      const offset = (StickyHeaderComponent ? 1 : 0) + (SubHeaderComponent ? 1 : 0);
      const dataIndex = index - offset;

      const renderedItem = renderItem(item, dataIndex);
      if (!animateItems) return renderedItem;
      return <Reveal delay={Math.min(dataIndex * 35, 180)}>{renderedItem}</Reveal>;
    },
    [animateItems, renderItem, StickyHeaderComponent, SubHeaderComponent],
  );

  const extendedKeyExtractor = useCallback(
    (item: any) => {
      if (item.__isStickyHeader) return 'feed-sticky-header';
      if (item.__isSubHeader) return 'feed-sub-header';
      return keyExtractor(item);
    },
    [keyExtractor],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-xl items-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  const earlyReturnHeader = (
    <View className="gap-0">
      {ListHeaderComponent || filterBar ? (
        <View className="pt-header-top pb-md gap-sm">
          {ListHeaderComponent ? <Reveal delay={20}>{ListHeaderComponent}</Reveal> : null}
          {filterBar ? <Reveal delay={60}>{filterBar}</Reveal> : null}
        </View>
      ) : null}
      {StickyHeaderComponent ? <View>{StickyHeaderComponent}</View> : null}
      {SubHeaderComponent ? <View>{SubHeaderComponent}</View> : null}
    </View>
  );

  const combinedHeader =
    ListHeaderComponent || filterBar ? (
      <View className="pt-header-top pb-md gap-sm">
        {ListHeaderComponent ? <Reveal delay={20}>{ListHeaderComponent}</Reveal> : null}
        {filterBar ? <Reveal delay={60}>{filterBar}</Reveal> : null}
      </View>
    ) : null;

  if (isLoading) {
    return (
      <ScreenContainer className={className} testID={testID}>
        {earlyReturnHeader}
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
        {earlyReturnHeader}
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
        {earlyReturnHeader}
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
        className="flex-1"
        data={extendedData}
        renderItem={renderListItem}
        keyExtractor={extendedKeyExtractor}
        stickyHeaderIndices={StickyHeaderComponent ? [combinedHeader ? 1 : 0] : undefined}
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
