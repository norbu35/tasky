import React, { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlatList, RefreshControl, View } from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';

import { TaskCard, SkeletonCard, Header, EmptyState, ErrorState } from './CustomerTasks.parts';
import { useCustomerTasks } from './useCustomerTasks';

const { colors } = mobileTheme;

export default function MyTasksListScreen() {
  const {
    tasks,
    counts,
    isLoading,
    isError,
    isFetching,
    refetch,
    handleFabPress,
    handleNotificationsPress,
    handleTaskPress,
  } = useCustomerTasks();
  const insets = useSafeAreaInsets();

  const header = useMemo(
    () => <Header counts={counts} onNotificationsPress={handleNotificationsPress} />,
    [counts, handleNotificationsPress],
  );

  return (
    <ScreenContainer testID="SCR-CUST-001" padded={false}>
      {isLoading ? (
        <View className="flex-1" testID="my-tasks-loading-state">
          {header}
          <View className="gap-item pt-item">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </View>
        </View>
      ) : isError ? (
        <View className="flex-1">
          {header}
          <ErrorState onRetry={refetch} />
        </View>
      ) : (
        <>
          <FlatList
            className="flex-1"
            data={tasks}
            keyExtractor={(task) => task.id}
            renderItem={({ item }) => (
              <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />
            )}
            ListHeaderComponent={header}
            ListEmptyComponent={<EmptyState onPostTask={handleFabPress} />}
            contentContainerStyle={{
              paddingBottom: screenLayout.chrome.contentBottomClearance + insets.bottom,
            }}
            refreshControl={
              <RefreshControl
                refreshing={Boolean(isFetching && !isLoading)}
                onRefresh={refetch}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ItemSeparatorComponent={() => <View className="h-item" />}
            showsVerticalScrollIndicator={false}
            testID="my-tasks-feed"
          />
        </>
      )}
    </ScreenContainer>
  );
}
