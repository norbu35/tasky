import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FeedListTemplate } from '../../../../components/templates/FeedListTemplate';
import { useCategories } from '../../../../features/tasks/hooks/useCategories';
import { mobileTheme } from '../../../../design/tokenAdapter';
import type { Category } from '../../../../lib/mobileApiClient';

const { colors, spacing, radius, typography } = mobileTheme;

export default function CategorySelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError } = useCategories();

  const categories = data?.data ?? [];

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      router.push({
        pathname: '/(customer)/tasks/new/intake',
        params: { categoryId },
      });
    },
    [router],
  );

  const renderCategory = useCallback(
    (category: Category) => (
      <Pressable
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(category.id)}
        testID={`category-item-${category.id}`}
        accessibilityRole="button"
      >
        <Text style={styles.categoryName}>{category.name}</Text>
      </Pressable>
    ),
    [handleCategoryPress],
  );

  return (
    <View style={styles.container} testID="category-selection-screen">
      <Text style={styles.title}>
        {t('customer.postTask.categoryTitle', 'What do you need help with?')}
      </Text>
      <FeedListTemplate
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(cat: Category) => cat.id}
        isLoading={isLoading}
        isError={isError}
        isEmpty={categories.length === 0}
        emptyTitle={t('categories.empty', 'No categories available')}
        testID="category-feed"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryName: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
  },
});
