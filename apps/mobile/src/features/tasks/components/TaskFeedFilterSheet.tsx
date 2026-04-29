import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFooter,
  type BottomSheetFooterProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { CalendarDays, Coins, Tag, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Touchable } from '@/components/ui/Touchable';
import { elevations, mobileTheme, overlays } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors, radius, spacing } = mobileTheme;

const SHEET_CONTAINER_STYLE = {
  position: 'absolute' as const,
  inset: 0,
};

const HANDLE_WIDTH = 40;
const HANDLE_HEIGHT = 4;

export type ScheduleWindow = 'any' | 'today' | 'tomorrow' | 'this-week';
export type PricingModeFilter = 'any' | 'BUDGET' | 'QUOTE';

interface FilterItem {
  id: string;
  label: string;
}

interface TaskFeedFilterSheetProps {
  visible: boolean;
  resultCount: number;

  categories: FilterItem[];
  activeFilters: string[];
  onToggleFilter: (id: string) => void;

  scheduleWindow: ScheduleWindow;
  onScheduleWindowChange: (next: ScheduleWindow) => void;

  pricingMode: PricingModeFilter;
  onPricingModeChange: (next: PricingModeFilter) => void;

  minBudget: number | null;
  maxBudget: number | null;
  onBudgetChange: (next: { min: number | null; max: number | null }) => void;

  onClearFilters: () => void;
  onClose: () => void;
}

interface PillOption<T extends string> {
  id: T;
  label: string;
}

interface PillToggleGroupProps<T extends string> {
  options: PillOption<T>[];
  value: T;
  onChange: (next: T) => void;
  testID?: string;
}

function PillToggleGroup<T extends string>({
  options,
  value,
  onChange,
  testID,
}: PillToggleGroupProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-sm" testID={testID}>
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.id)}
            className={cn(
              'rounded-full px-md py-sm border',
              isActive ? 'bg-foreground border-foreground' : 'bg-card border-border',
            )}
            testID={testID ? `${testID}-${option.id}` : undefined}
          >
            <Text
              className={cn(
                'text-caption font-sans-semibold',
                isActive ? 'text-primary-foreground' : 'text-foreground',
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface CategoryChipsProps {
  categories: FilterItem[];
  activeFilters: string[];
  onToggle: (id: string) => void;
  testID?: string;
}

function CategoryChips({ categories, activeFilters, onToggle, testID }: CategoryChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-sm" testID={testID}>
      {categories.map((category) => {
        const isActive = activeFilters.includes(category.id);
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={category.label}
            onPress={() => onToggle(category.id)}
            className={cn(
              'rounded-full px-md py-sm border',
              isActive ? 'bg-foreground border-foreground' : 'bg-card border-border',
            )}
            testID={testID ? `${testID}-option-${category.id}` : undefined}
          >
            <Text
              className={cn(
                'text-caption font-sans-semibold',
                isActive ? 'text-primary-foreground' : 'text-foreground',
              )}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <View className="gap-md py-lg border-t border-border">
      <View className="flex-row items-center gap-sm">
        {icon}
        <Text className="text-body font-sans-bold text-foreground">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function parseBudgetInput(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

function formatBudgetInput(value: number | null): string {
  if (value == null) return '';
  return value.toLocaleString('en-US');
}

export function TaskFeedFilterSheet({
  visible,
  resultCount,
  categories,
  activeFilters,
  onToggleFilter,
  scheduleWindow,
  onScheduleWindowChange,
  pricingMode,
  onPricingModeChange,
  minBudget,
  maxBudget,
  onBudgetChange,
  onClearFilters,
  onClose,
}: TaskFeedFilterSheetProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ['85%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        style={[props.style, { backgroundColor: overlays.sheet }]}
        pressBehavior="close"
      />
    ),
    [],
  );

  const scheduleOptions: PillOption<ScheduleWindow>[] = useMemo(
    () => [
      { id: 'any', label: t('tasker.browse.scheduleAny') },
      { id: 'today', label: t('tasker.browse.scheduleToday') },
      { id: 'tomorrow', label: t('tasker.browse.scheduleTomorrow') },
      { id: 'this-week', label: t('tasker.browse.scheduleThisWeek') },
    ],
    [t],
  );

  const pricingOptions: PillOption<PricingModeFilter>[] = useMemo(
    () => [
      { id: 'any', label: t('tasker.browse.pricingAny') },
      { id: 'BUDGET', label: t('tasker.browse.pricingBudget') },
      { id: 'QUOTE', label: t('tasker.browse.pricingQuote') },
    ],
    [t],
  );

  const showBudgetInputs = pricingMode !== 'QUOTE';

  const handleMinChange = useCallback(
    (text: string) => onBudgetChange({ min: parseBudgetInput(text), max: maxBudget }),
    [onBudgetChange, maxBudget],
  );

  const handleMaxChange = useCallback(
    (text: string) => onBudgetChange({ min: minBudget, max: parseBudgetInput(text) }),
    [onBudgetChange, minBudget],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View
          className="flex-row items-center justify-between gap-md bg-card px-lg py-md border-t border-border"
          style={elevations.elevated}
        >
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={t('tasker.browse.clearFilters')}
            onPress={onClearFilters}
            className="px-sm py-sm"
            testID="task-feed-filter-sheet-clear"
          >
            <Text className="text-caption font-sans-bold underline text-foreground">
              {t('tasker.browse.clearFilters')}
            </Text>
          </Touchable>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="rounded-md bg-foreground px-lg py-md"
            testID="task-feed-filter-sheet-show-results"
          >
            <Text className="text-caption font-sans-bold text-primary-foreground">
              {t('tasker.browse.showResults', { count: resultCount })}
            </Text>
          </Pressable>
        </View>
      </BottomSheetFooter>
    ),
    [insets.bottom, onClearFilters, onClose, resultCount, t],
  );

  return (
    <View
      testID="task-feed-filter-sheet"
      pointerEvents={visible ? 'auto' : 'none'}
      style={SHEET_CONTAINER_STYLE}
    >
      <BottomSheet
        ref={bottomSheetRef}
        index={visible ? 0 : -1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        backgroundStyle={{
          backgroundColor: colors.card,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          ...elevations.elevated,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
          width: HANDLE_WIDTH,
          height: HANDLE_HEIGHT,
          borderRadius: radius.full,
        }}
      >
        <View className="flex-row items-center justify-between px-lg pb-md">
          <View className="w-9" />
          <Text className="text-body font-sans-bold text-foreground">
            {t('tasker.browse.filterSheetTitle')}
          </Text>
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full"
            testID="task-feed-filter-sheet-close"
          >
            <X size={22} color={colors.foreground} />
          </Touchable>
        </View>

        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing['3xl'] + 64,
          }}
        >
          <View className="gap-xs pb-md">
            <Text className="text-body font-sans-bold text-foreground">
              {t('tasker.browse.resultCount', { count: resultCount })}
            </Text>
            <Text className="text-caption text-text-secondary leading-5">
              {t('tasker.browse.filterSheetDescription')}
            </Text>
          </View>

          <Section
            icon={<CalendarDays size={18} color={colors.foreground} />}
            title={t('tasker.browse.filterSchedule')}
          >
            <PillToggleGroup
              options={scheduleOptions}
              value={scheduleWindow}
              onChange={onScheduleWindowChange}
              testID="task-feed-filter-sheet-schedule"
            />
          </Section>

          <Section
            icon={<Coins size={18} color={colors.foreground} />}
            title={t('tasker.browse.filterPricing')}
          >
            <PillToggleGroup
              options={pricingOptions}
              value={pricingMode}
              onChange={onPricingModeChange}
              testID="task-feed-filter-sheet-pricing"
            />
            {showBudgetInputs ? (
              <View className="gap-sm pt-sm">
                <Text className="text-caption font-sans-semibold text-text-secondary">
                  {t('tasker.browse.filterBudget')}
                </Text>
                <View className="flex-row items-center gap-md">
                  <View
                    className="flex-1 flex-row items-center rounded-md border border-border bg-card px-md"
                    style={{ minHeight: 44 }}
                  >
                    <Text className="text-body font-sans-bold text-text-secondary mr-xs">₮</Text>
                    <TextInput
                      value={formatBudgetInput(minBudget)}
                      onChangeText={handleMinChange}
                      keyboardType="number-pad"
                      placeholder={t('tasker.browse.budgetMinPlaceholder')}
                      placeholderTextColor={colors.textTertiary}
                      className="flex-1 text-body font-sans text-foreground py-sm"
                      testID="task-feed-filter-sheet-budget-min"
                    />
                  </View>
                  <Text className="text-caption text-text-tertiary">–</Text>
                  <View
                    className="flex-1 flex-row items-center rounded-md border border-border bg-card px-md"
                    style={{ minHeight: 44 }}
                  >
                    <Text className="text-body font-sans-bold text-text-secondary mr-xs">₮</Text>
                    <TextInput
                      value={formatBudgetInput(maxBudget)}
                      onChangeText={handleMaxChange}
                      keyboardType="number-pad"
                      placeholder={t('tasker.browse.budgetMaxPlaceholder')}
                      placeholderTextColor={colors.textTertiary}
                      className="flex-1 text-body font-sans text-foreground py-sm"
                      testID="task-feed-filter-sheet-budget-max"
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </Section>

          <Section
            icon={<Tag size={18} color={colors.foreground} />}
            title={t('tasker.browse.filterCategory')}
          >
            <CategoryChips
              categories={categories}
              activeFilters={activeFilters}
              onToggle={onToggleFilter}
              testID="task-feed-filter-sheet-options"
            />
          </Section>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
