import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
  Search,
} from 'lucide-react-native';
import { Input } from '../../../../components/ui/Input';
import { StepIndicator } from '../../../../components/ui/StepIndicator';
import { useCategories } from '../../../../features/tasks/hooks/useCategories';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import type { Category } from '../../../../lib/mobileApiClient';
import { InsetScrollView, ScreenContainer } from '../../../../components/shells';

const { colors, spacing, radius, typography } = mobileTheme;

type CategoryVisual = {
  description: string;
  icon: typeof Sparkles;
  tint: string;
  tone: string;
};

function getCategoryVisual(name: string): CategoryVisual {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes('clean')) {
    return {
      description: 'Deep, regular, or move-out',
      icon: Sparkles,
      tint: colors.primary,
      tone: `${colors.primary}12`,
    };
  }

  if (normalized.includes('handy') || normalized.includes('repair')) {
    return {
      description: 'Repairs and installations',
      icon: Hammer,
      tint: colors.secondary,
      tone: `${colors.secondary}1A`,
    };
  }

  if (normalized.includes('moving')) {
    return {
      description: 'Furniture, boxes, delivery',
      icon: Package,
      tint: colors.accent,
      tone: `${colors.accent}1A`,
    };
  }

  if (normalized.includes('laundry')) {
    return {
      description: 'Wash, fold, and iron',
      icon: Shirt,
      tint: colors.primaryDeep,
      tone: `${colors.primaryDeep}14`,
    };
  }

  if (normalized.includes('electric')) {
    return {
      description: 'Wiring, lighting, outlets',
      icon: Bolt,
      tint: colors.secondary,
      tone: `${colors.secondary}1A`,
    };
  }

  if (normalized.includes('garden')) {
    return {
      description: 'Mowing, weeding, planting',
      icon: Leaf,
      tint: colors.trust,
      tone: `${colors.trust}18`,
    };
  }

  return {
    description: 'Pick the best fit and add details next',
    icon: Sparkles,
    tint: colors.primary,
    tone: `${colors.primary}12`,
  };
}

function CategoryCard({ category, onPress }: { category: Category; onPress: () => void }) {
  const visual = getCategoryVisual(category.name);
  const Icon = visual.icon;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={`category-item-${category.id}`}
      style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}
    >
      <View style={[styles.categoryIconWrap, { backgroundColor: visual.tone }]}>
        <Icon color={visual.tint} size={22} />
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
    </Pressable>
  );
}

export default function CategorySelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCategories();
  const [query, setQuery] = useState('');

  const categories = useMemo(() => data?.data ?? [], [data?.data]);
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(normalizedQuery));
  }, [categories, query]);

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId);
      router.push({
        pathname: '/(customer)/tasks/new/intake',
        params: {
          categoryId,
          intakeEnabled: category?.intake_enabled ? '1' : '0',
          intakeSchemaVersion: String(category?.intake_schema_version ?? ''),
          intakeSchemaJson: category?.intake_schema_json
            ? JSON.stringify(category.intake_schema_json)
            : '',
        },
      });
    },
    [router, categories],
  );

  return (
    <ScreenContainer testID="category-selection-screen">
      {/* Header — frosted bar with back + title */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('wizard.close', 'Close')}
          onPress={() => router.back()}
          style={styles.backButton}
          testID="category-selection-back"
        >
          <ChevronLeft size={20} color={colors.primaryDeep} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t('customer.postTask.categoryInstruction', 'Ангилал сонгох')}
        </Text>
      </View>

      <InsetScrollView
        testID="category-selection-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraBottomInset={spacing.xl}
      >
        <View style={styles.stepIndicatorBlock}>
          <Text style={styles.stepLabel}>
            {t('customer.postTask.stepCategory', 'Алхам 1/7 • Ангилал')}
          </Text>
          <StepIndicator currentStep={1} totalSteps={7} testID="category-selection-step-indicator" />
        </View>

        {/* Search — flat tonal */}
        <View style={styles.searchWrap}>
          <Search size={18} color={`${colors.textSecondary}99`} />
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t('customer.postTask.searchCategories', 'Ангилал хайх...')}
            testID="category-selection-search"
            style={styles.searchInput}
          />
        </View>

        {/* Editorial intro */}
        <Text style={styles.editorialIntro}>
          {t(
            'customer.postTask.categorySupport',
            'Танд тусламж хэрэгтэй байгаа салбараа сонгоно уу. Бид танд мэргэжлийн гүйцэтгэгчийг санал болгох болно.',
          )}
        </Text>

        {/* Category grid */}
        {isLoading ? (
          <View style={styles.loadingState} testID="category-selection-loading">
            <ActivityIndicator color={colors.primary} />
            <View style={styles.grid}>
              {Array.from({ length: 8 }).map((_, index) => (
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
            <Pressable
              onPress={() => refetch()}
              style={styles.retryButton}
              testID="category-selection-retry"
            >
              <Text style={styles.retryLabel}>
                {t('customer.postTask.categoryRetry', 'Try again')}
              </Text>
            </Pressable>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              {t('categories.empty', 'No categories available')}
            </Text>
          </View>
        ) : (
          <View style={styles.grid} testID="category-selection-grid">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => handleCategoryPress(category.id)}
              />
            ))}
          </View>
        )}

        {/* Featured banner — dark navy */}
        <View style={styles.featuredBanner}>
          <Text style={styles.featuredTitle}>
            {t('customer.postTask.featuredTitle', 'Мэргэжлийн зөвлөгөө')}
          </Text>
          <Text style={styles.featuredBody}>
            {t(
              'customer.postTask.featuredBody',
              'Аль ангиллыг сонгохоо мэдэхгүй байна уу? Бид танд тусалъя.',
            )}
          </Text>
        </View>
      </InsetScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    height: 64,
  },
  backButton: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  stepIndicatorBlock: {
    gap: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    height: 56,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 40,
    backgroundColor: 'transparent',
  },
  editorialIntro: {
    fontSize: typography.label,
    color: colors.textSecondary,
    lineHeight: typography.label * 1.625,
    maxWidth: 274,
  },
  loadingState: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  loadingCard: {
    width: '47%',
    minHeight: 163,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  messageCard: {
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    gap: spacing.sm,
    ...elevations.soft,
  },
  messageTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  messageBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
  retryButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  retryLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.secondaryForeground,
  },
  categoryCard: {
    width: '47%',
    minHeight: 163,
    padding: 20,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    justifyContent: 'space-between',
  },
  categoryCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryDeep,
    marginTop: spacing.xl,
  },
  featuredBanner: {
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  featuredTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryForeground,
    marginBottom: spacing.xs,
  },
  featuredBody: {
    fontSize: typography.caption,
    color: colors.primaryForeground,
    opacity: 0.8,
    lineHeight: typography.caption * 1.35,
    maxWidth: 180,
  },
});
