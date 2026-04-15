import { useRouter } from 'expo-router';
import { Bolt, ChevronRight, Hammer, Leaf, Package, Shirt, Sparkles } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { useCategories } from '../../../../features/tasks/hooks/useCategories';
import type { Category } from '../../../../lib/mobileApiClient';

const { colors, spacing } = mobileTheme;

type CategoryVisual = {
  descriptionKey: string;
  icon: typeof Sparkles;
  tint: string;
  tone: string;
};

function getCategoryVisual(name: string): CategoryVisual {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes('clean')) {
    return {
      descriptionKey: 'CategorySelectionScreen.cleaningDescription',
      icon: Sparkles,
      tint: colors.primary,
      tone: `${colors.primary}12`,
    };
  }

  if (normalized.includes('handy') || normalized.includes('repair')) {
    return {
      descriptionKey: 'CategorySelectionScreen.repairDescription',
      icon: Hammer,
      tint: colors.secondary,
      tone: `${colors.secondary}1A`,
    };
  }

  if (normalized.includes('moving')) {
    return {
      descriptionKey: 'CategorySelectionScreen.movingDescription',
      icon: Package,
      tint: colors.accent,
      tone: `${colors.accent}1A`,
    };
  }

  if (normalized.includes('laundry')) {
    return {
      descriptionKey: 'CategorySelectionScreen.laundryDescription',
      icon: Shirt,
      tint: colors.primaryDeep,
      tone: `${colors.primaryDeep}14`,
    };
  }

  if (normalized.includes('electric')) {
    return {
      descriptionKey: 'CategorySelectionScreen.electricDescription',
      icon: Bolt,
      tint: colors.secondary,
      tone: `${colors.secondary}1A`,
    };
  }

  if (normalized.includes('garden')) {
    return {
      descriptionKey: 'CategorySelectionScreen.gardenDescription',
      icon: Leaf,
      tint: colors.trust,
      tone: `${colors.trust}18`,
    };
  }

  return {
    descriptionKey: 'CategorySelectionScreen.defaultDescription',
    icon: Sparkles,
    tint: colors.primary,
    tone: `${colors.primary}12`,
  };
}

export default function CategorySelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCategories();

  const categories = useMemo(() => data?.data ?? [], [data?.data]);

  const handleCategorySelect = useCallback(
    (category: Category) => {
      router.push({
        pathname: '/(customer)/tasks/new/intake',
        params: {
          categoryId: category.id,
          categoryName: category.name,
          intakeEnabled: category.intake_enabled ? '1' : '0',
          intakeSchemaVersion: String(category.intake_schema_version ?? ''),
          intakeSchemaJson: category.intake_schema_json
            ? JSON.stringify(category.intake_schema_json)
            : '',
        },
      });
    },
    [router],
  );

  return (
    <FormWizardTemplate
      currentStep={0}
      totalSteps={7}
      onNext={() => {}}
      showBack={false}
      hideNext
      greeting={t('CategorySelectionScreen.greeting')}
      title={t('CategorySelectionScreen.pageTitle')}
      testID="SCR-CUST-002"
    >
      <Text className="text-body text-text-secondary leading-[22px]">
        {t('CategorySelectionScreen.intro')}
      </Text>

      {/* Category list */}
      {isLoading ? (
        <View className="py-xl items-center" testID="category-selection-loading">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View className="p-xl gap-sm rounded-md bg-card" style={elevations.soft}>
          <Text className="text-body font-sans-bold text-primary-deep">
            {t('CategorySelectionScreen.loadError')}
          </Text>
          <Text className="text-caption text-text-secondary leading-[18px]">
            {t('CategorySelectionScreen.loadHint')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="min-h-[44px] self-start px-md items-center justify-center rounded-md bg-secondary"
            testID="category-selection-retry"
          >
            <Text className="text-caption font-sans-bold text-secondary-foreground">
              {t('CategorySelectionScreen.retry')}
            </Text>
          </Pressable>
        </View>
      ) : categories.length === 0 ? (
        <View className="p-xl gap-sm rounded-md bg-card">
          <Text className="text-body font-sans-bold text-primary-deep">
            {t('CategorySelectionScreen.noCategories')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.md }} testID="category-selection-grid">
          {categories.map((category) => {
            const visual = getCategoryVisual(category.name);
            const Icon = visual.icon;
            return (
              <Pressable
                key={category.id}
                testID={`category-item-${category.id}`}
                accessibilityRole="button"
                onPress={() => handleCategorySelect(category)}
                className="flex-row items-center gap-md p-md rounded-lg bg-card"
                style={({ pressed }) => [
                  elevations.soft,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                ]}
              >
                {/* Image placeholder — swap for <Image> when assets are ready */}
                <View
                  className="rounded-md items-center justify-center overflow-hidden shrink-0"
                  style={{ width: 120, height: 80, backgroundColor: visual.tone }}
                >
                  <Icon color={visual.tint} size={36} />
                </View>
                <View className="flex-1 gap-xs min-w-0">
                  <Text className="font-screen-card-title text-primary-deep" numberOfLines={1}>
                    {category.name}
                  </Text>
                  <Text className="text-caption text-text-secondary" numberOfLines={2}>
                    {t(visual.descriptionKey)}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Featured banner */}
      <View className="p-xl overflow-hidden rounded-md bg-primary">
        <Text className="text-subtitle font-sans-bold mb-xs text-primary-foreground">
          {t('CategorySelectionScreen.featuredTitle')}
        </Text>
        <Text
          className="text-caption text-primary-foreground opacity-80 leading-[18px]"
          style={{ maxWidth: 180 }}
        >
          {t('CategorySelectionScreen.featuredBody')}
        </Text>
      </View>
    </FormWizardTemplate>
  );
}
