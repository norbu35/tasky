import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Bolt,
  ChevronLeft,
  Hammer,
  Leaf,
  Package,
  Shirt,
  Sparkles,
} from 'lucide-react-native';
import { useCategories } from '../../../../features/tasks/hooks/useCategories';
import { StepIndicator } from '../../../../components/ui/StepIndicator';
import { mobileTheme } from '../../../../design/tokenAdapter';
import type { Category } from '../../../../lib/mobileApiClient';

const { colors, spacing, radius, typography } = mobileTheme;

type CategoryVisual = {
  description: string;
  icon: typeof Sparkles;
  tint: string;
  tone: string;
};

export default function CategorySelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError } = useCategories();

  const categories = data?.data ?? [];
  const stepLabel = t('taskPost.step', 'Step {{current}} of {{total}}')
    .replace('{{current}}', '1')
    .replace('{{total}}', '7');

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      router.push({
        pathname: '/(customer)/tasks/new/intake',
        params: { categoryId },
      });
    },
    [router],
  );

  const getCategoryVisual = useCallback(
    (name: string): CategoryVisual => {
      const normalized = name.trim().toLowerCase();

      if (normalized.includes('clean')) {
        return {
          description: t('categories.cleaningDesc', 'Deep, regular, or move-out'),
          icon: Sparkles,
          tint: colors.primary,
          tone: colors.primary + '12',
        };
      }

      if (normalized.includes('handy') || normalized.includes('repair')) {
        return {
          description: t('categories.handymanDesc', 'Repairs and installations'),
          icon: Hammer,
          tint: colors.secondary,
          tone: colors.secondary + '1A',
        };
      }

      if (normalized.includes('moving')) {
        return {
          description: t('categories.movingDesc', 'Furniture, boxes, delivery'),
          icon: Package,
          tint: colors.accent,
          tone: colors.accent + '1A',
        };
      }

      if (normalized.includes('laundry')) {
        return {
          description: t('categories.laundryDesc', 'Wash, fold, and iron'),
          icon: Shirt,
          tint: colors.primaryDeep,
          tone: colors.primaryDeep + '14',
        };
      }

      if (normalized.includes('electric')) {
        return {
          description: t('categories.electricianDesc', 'Wiring, lighting, outlets'),
          icon: Bolt,
          tint: colors.secondary,
          tone: colors.secondary + '1A',
        };
      }

      if (normalized.includes('garden')) {
        return {
          description: t('categories.gardeningDesc', 'Mowing, weeding, planting'),
          icon: Leaf,
          tint: colors.trust,
          tone: colors.trust + '18',
        };
      }

      return {
        description: t('customer.postTask.categorySupport', 'Pick the best fit and add details next'),
        icon: Sparkles,
        tint: colors.primary,
        tone: colors.primary + '12',
      };
    },
    [t],
  );

  const renderCategory = useCallback(
    (category: Category) => {
      const visual = getCategoryVisual(category.name);
      const Icon = visual.icon;

      return (
        <Pressable
          key={category.id}
          style={styles.categoryCard}
          onPress={() => handleCategoryPress(category.id)}
          testID={`category-item-${category.id}`}
          accessibilityRole="button"
        >
          <View style={[styles.categoryIconWrap, { backgroundColor: visual.tone }]}>
            <Icon color={visual.tint} size={22} />
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>{visual.description}</Text>
        </Pressable>
      );
    },
    [getCategoryVisual, handleCategoryPress],
  );

  return (
    <View style={styles.container} testID="category-selection-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          testID="category-selection-back"
          accessibilityRole="button"
        >
          <ChevronLeft size={22} color={colors.primary} />
          <Text style={styles.backLabel}>{t('common.back', 'Back')}</Text>
        </Pressable>
        <Text style={styles.pageTitle}>{t('customer.postTask.selectCategory', 'Select Category')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="category-selection-scroll"
      >
        <View style={styles.hero}>
          <Text style={styles.stepLabel}>{stepLabel}</Text>
          <StepIndicator currentStep={1} totalSteps={7} testID="category-selection-step-indicator" />
          <Text style={styles.title}>
            {t('customer.postTask.categoryInstruction', 'What type of task do you need?')}
          </Text>
          <Text style={styles.support}>
            {t(
              'customer.postTask.categorySupport',
              'Pick the closest match. You can refine the scope in the next step.',
            )}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} size="small" />
            <View style={styles.grid}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} style={styles.loadingCard} />
              ))}
            </View>
          </View>
        ) : isError ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              {t('customer.postTask.categoryLoadError', 'Failed to load categories')}
            </Text>
            <Text style={styles.messageBody}>
              {t('customer.postTask.categoryLoadHint', 'Pull to refresh or try again shortly.')}
            </Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              {t('categories.empty', 'No categories available')}
            </Text>
          </View>
        ) : (
          <View style={styles.grid} testID="category-selection-grid">
            {categories.map(renderCategory)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.primary,
  },
  pageTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
    marginHorizontal: spacing.sm,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.xl,
  },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
    lineHeight: typography.heading * 1.12,
  },
  support: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    minHeight: 170,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  categoryDescription: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.6,
  },
  loadingState: {
    gap: spacing.lg,
  },
  loadingCard: {
    width: '47%',
    height: 170,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
  },
  messageCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  messageTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.foreground,
  },
  messageBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.6,
  },
});
