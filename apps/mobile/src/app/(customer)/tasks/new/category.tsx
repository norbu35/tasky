import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bolt, Hammer, Leaf, Package, Shirt, Sparkles, Search } from 'lucide-react-native';
import { Input } from '../../../../components/ui/Input';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { useCategories } from '../../../../features/tasks/hooks/useCategories';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { screenLayout } from '../../../../design/screenLayout';
import { cn } from '../../../../lib/cn';
import type { Category } from '../../../../lib/mobileApiClient';

const { colors, spacing, radius } = mobileTheme;

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

function CategoryCard({
  category,
  cardWidth,
  onPress,
}: {
  category: Category;
  cardWidth: number;
  onPress: () => void;
}) {
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
          width: cardWidth,
          borderRadius: radius.md,
          backgroundColor: colors.card,
          overflow: 'hidden',
        },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Large image placeholder — icon centered in a colored rectangle */}
      <View
        style={{
          width: '100%',
          aspectRatio: 4 / 3,
          backgroundColor: visual.tone,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon color={visual.tint} size={44} />
      </View>

      {/* Card label */}
      <View style={{ padding: 12, gap: 4 }}>
        <Text className="text-label font-sans-semibold" style={{ color: colors.primaryDeep }}>
          {category.name}
        </Text>
        <Text className="text-caption" style={{ color: colors.textSecondary, lineHeight: 18 }}>
          {t(visual.descriptionKey)}
        </Text>
      </View>
    </Pressable>
  );
}

function SkeletonCard({ cardWidth }: { cardWidth: number }) {
  return (
    <View
      style={{
        width: cardWidth,
        borderRadius: radius.md,
        backgroundColor: colors.muted,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.border }} />
      <View style={{ padding: 12, gap: 8 }}>
        <View
          style={{ height: 14, width: '65%', borderRadius: 4, backgroundColor: colors.border }}
        />
        <View
          style={{ height: 12, width: '90%', borderRadius: 4, backgroundColor: colors.border }}
        />
      </View>
    </View>
  );
}

export default function CategorySelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCategories();
  const [query, setQuery] = useState('');

  const { width: windowWidth } = useWindowDimensions();
  // Two columns, separated by spacing.md, inset on both sides by the screen horizontal padding
  const cardWidth = Math.floor((windowWidth - 2 * screenLayout.insetX - spacing.md) / 2);

  const categories = useMemo(() => data?.data ?? [], [data?.data]);
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(normalizedQuery));
  }, [categories, query]);

  // Group into rows of 2 for a reliable 2-column grid on all platforms
  const categoryRows = useMemo(() => {
    const rows: Category[][] = [];
    for (let i = 0; i < filteredCategories.length; i += 2) {
      rows.push(filteredCategories.slice(i, i + 2));
    }
    return rows;
  }, [filteredCategories]);

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
          style={{
            flex: 1,
            borderWidth: 0,
            paddingHorizontal: 0,
            paddingVertical: 0,
            minHeight: 40,
            backgroundColor: 'transparent',
          }}
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
        <View style={{ gap: spacing.md }} testID="category-selection-loading">
          <ActivityIndicator color={colors.primary} />
          {[
            [0, 1],
            [2, 3],
          ].map((pair, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row', gap: spacing.md }}>
              {pair.map((i) => (
                <SkeletonCard key={i} cardWidth={cardWidth} />
              ))}
            </View>
          ))}
        </View>
      ) : isError ? (
        <View
          className="p-xl gap-sm"
          style={[{ borderRadius: radius.md, backgroundColor: colors.card }, elevations.soft]}
        >
          <Text className="text-body font-sans-bold" style={{ color: colors.primaryDeep }}>
            {t('CategorySelectionScreen.loadError')}
          </Text>
          <Text className="text-caption" style={{ color: colors.textSecondary, lineHeight: 18 }}>
            {t('CategorySelectionScreen.loadHint')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="min-h-[44px] self-start px-md items-center justify-center"
            style={{ borderRadius: radius.md, backgroundColor: colors.secondary }}
            testID="category-selection-retry"
          >
            <Text
              className="text-caption font-sans-bold"
              style={{ color: colors.secondaryForeground }}
            >
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
        <View style={{ gap: spacing.md }} testID="category-selection-grid">
          {categoryRows.map((row, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row', gap: spacing.md }}>
              {row.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  cardWidth={cardWidth}
                  onPress={() => handleCategorySelect(category)}
                />
              ))}
              {/* Fill the last row if it has an odd item */}
              {row.length === 1 && <View style={{ width: cardWidth }} />}
            </View>
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
