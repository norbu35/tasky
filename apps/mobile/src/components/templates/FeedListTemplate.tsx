import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { animationPresets } from '../../design/animations';
import { EmptyStateTemplate } from './EmptyStateTemplate';
import { ErrorStateTemplate } from './ErrorStateTemplate';

const { colors, spacing, radius } = mobileTheme;

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
    <Animated.View style={[styles.skeletonCard, animatedStyle]}>
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonLineMiddle} />
    </Animated.View>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
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
}: FeedListTemplateProps<T>) {
  const { t } = useTranslation();

  const renderListItem = useCallback(
    ({ item, index }: { item: T; index: number }) => renderItem(item, index),
    [renderItem],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  if (isLoading) {
    return (
      <View style={styles.container} testID={testID}>
        {filterBar ? <View style={styles.filterBarWrapper}>{filterBar}</View> : null}
        {ListHeaderComponent}
        <View style={styles.skeletonList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ItemSeparator />}
              <SkeletonCard />
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container} testID={testID}>
        <ErrorStateTemplate
          message={errorMessage ?? t('feed.errorMessage', 'Failed to load content')}
          onRetry={onRetry}
          retryLabel={retryLabel}
          testID={testID ? `${testID}-error` : undefined}
        />
      </View>
    );
  }

  if (isEmpty || data.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        {filterBar ? <View style={styles.filterBarWrapper}>{filterBar}</View> : null}
        <EmptyStateTemplate
          title={emptyTitle ?? t('feed.emptyTitle', 'Nothing here yet')}
          description={emptyDescription}
          ctaLabel={emptyCtaLabel}
          ctaOnPress={emptyCtaOnPress}
          testID={testID ? `${testID}-empty` : undefined}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {filterBar ? <View style={styles.filterBarWrapper}>{filterBar}</View> : null}
      <FlatList
        data={data}
        renderItem={renderListItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={ListHeaderComponent}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  skeletonList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  skeletonCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: spacing.lg,
    backgroundColor: colors.chipInactive,
    borderRadius: radius.xs,
    alignSelf: 'stretch',
  },
  skeletonLineShort: {
    height: spacing.md,
    backgroundColor: colors.chipInactive,
    borderRadius: radius.xs,
    width: '60%',
  },
  skeletonLineMiddle: {
    height: spacing.md,
    backgroundColor: colors.chipInactive,
    borderRadius: radius.xs,
    width: '80%',
  },
  filterBarWrapper: {
    flexShrink: 0,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
