import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bolt, Hammer, Leaf, Package, Shirt, Sparkles, Search } from 'lucide-react-native';
import { Input } from '../../../../components/ui/Input';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { useCategories } from '../../../../features/tasks/hooks/useCategories';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { cn } from '../../../../lib/cn';
import type { Category } from '../../../../lib/mobileApiClient';

const { colors, radius } = mobileTheme;

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

function CategoryCard({ category, onPress }: { category: Category; onPress: () => void }) {
  const { t } = useTranslation();
  const visual = getCategoryVisual(category.name);
  const Icon = visual.icon;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={`category-item-${category.id}`}
      style={({ pressed }) => [
        {
          width: '47%',
          minHeight: 163,
          padding: 20,
          borderRadius: radius.md,
          backgroundColor: colors.muted,
          justifyContent: 'space-between',
        },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View
        className="w-[48px] h-[48px] items-center justify-center"
        style={{ borderRadius: radius.md, backgroundColor: visual.tone }}
      >
        <Icon color={visual.tint} size={22} />
      </View>
      <Text className="text-body font-sans-semibold mt-xl" style={{ color: colors.primaryDeep }}>
        {category.name}
      </Text>
      <Text className="text-caption" style={{ color: colors.textSecondary, lineHeight: 18 }}>
        {t(visual.descriptionKey)}
      </Text>
    </Pressable>
  );
}

export default function CategorySelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCategories();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => data?.data ?? [], [data?.data]);
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(normalizedQuery));
  }, [categories, query]);

  const handleCategorySelect = useCallback(() => {
    if (!selectedCategory) return;
    const category = categories.find((c) => c.id === selectedCategory);
    router.push({
      pathname: '/(customer)/tasks/new/intake',
      params: {
        categoryId: selectedCategory,
        intakeEnabled: category?.intake_enabled ? '1' : '0',
        intakeSchemaVersion: String(category?.intake_schema_version ?? ''),
        intakeSchemaJson: category?.intake_schema_json
          ? JSON.stringify(category.intake_schema_json)
          : '',
      },
    });
  }, [router, categories, selectedCategory]);

  return (
    <FormWizardTemplate
      currentStep={0}
      totalSteps={7}
      onNext={handleCategorySelect}
      showBack={false}
      nextLabel={t('common.continue')}
      nextDisabled={!selectedCategory}
      testID="SCR-CUST-002"
    >
      {/* Search — flat tonal */}
      <View
        className="flex-row items-center gap-sm px-lg h-[56px]"
        style={{ borderRadius: radius.sm, backgroundColor: colors.muted }}
      >
        <Search size={18} color={`${colors.textSecondary}99`} />
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t('CategorySelectionScreen.searchPlaceholder')}
          testID="category-selection-search"
          style={{ flex: 1, borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0, minHeight: 40, backgroundColor: 'transparent' }}
        />
      </View>

      {/* Editorial intro */}
      <Text
        className="text-label"
        style={{ color: colors.textSecondary, lineHeight: 22, maxWidth: 274 }}
      >
        {t('CategorySelectionScreen.intro')}
      </Text>

      {/* Category grid */}
      {isLoading ? (
        <View className="gap-md" testID="category-selection-loading">
          <ActivityIndicator color={colors.primary} />
          <View className="flex-row flex-wrap gap-lg">
            {Array.from({ length: 8 }).map((_, index) => (
              <View
                key={index}
                style={{ width: '47%', minHeight: 163, borderRadius: radius.md, backgroundColor: colors.muted }}
              />
            ))}
          </View>
        </View>
      ) : isError ? (
        <View
          className="p-xl gap-sm"
          style={[{ borderRadius: radius.md, backgroundColor: colors.card }, elevations.soft]}
        >
          <Text className="text-body font-sans-bold" style={{ color: colors.primaryDeep }}>
            {t('CategorySelectionScreen.loadError')}
          </Text>
          <Text
            className="text-caption"
            style={{ color: colors.textSecondary, lineHeight: 18 }}
          >
            {t('CategorySelectionScreen.loadHint')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="min-h-[44px] self-start px-md items-center justify-center"
            style={{ borderRadius: radius.md, backgroundColor: colors.secondary }}
            testID="category-selection-retry"
          >
            <Text className="text-caption font-sans-bold" style={{ color: colors.secondaryForeground }}>
              {t('CategorySelectionScreen.retry')}
            </Text>
          </Pressable>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View
          className="p-xl gap-sm"
          style={{ borderRadius: radius.md, backgroundColor: colors.card }}
        >
          <Text className="text-body font-sans-bold" style={{ color: colors.primaryDeep }}>
            {t('CategorySelectionScreen.noCategories')}
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-lg" testID="category-selection-grid">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </View>
      )}

      {/* Featured banner — dark navy */}
      <View
        className="p-xl overflow-hidden"
        style={{ borderRadius: radius.md, backgroundColor: colors.primary }}
      >
        <Text
          className="text-subtitle font-sans-bold mb-xs"
          style={{ color: colors.primaryForeground }}
        >
          {t('CategorySelectionScreen.featuredTitle')}
        </Text>
        <Text
          className="text-caption"
          style={{ color: colors.primaryForeground, opacity: 0.8, lineHeight: 18, maxWidth: 180 }}
        >
          {t('CategorySelectionScreen.featuredBody')}
        </Text>
      </View>
    </FormWizardTemplate>
  );
}
