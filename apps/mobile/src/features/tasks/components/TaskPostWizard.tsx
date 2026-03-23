import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  ChevronLeft,
  Briefcase,
  Wrench,
  Truck,
  Shirt,
  Zap,
  TreePine,
  MapPin,
  Calendar,
  DollarSign,
  Camera,
  Minus,
  Plus,
  Check,
} from 'lucide-react-native';
import { Button, TrustBanner } from '../../../components/ui';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';
import { useTranslation } from 'react-i18next';
import { useCreateTask } from '../hooks/useCreateTask';
import { useCategories } from '../hooks/useCategories';

const { colors, radius, typography } = mobileTheme;

/* ──────────────────────────────────────────────────────────
   Category definitions
   ────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { key: 'cleaning', icon: Briefcase, description: 'Deep, regular, or move-out' },
  { key: 'handyman', icon: Wrench, description: 'Repairs and installations' },
  { key: 'moving', icon: Truck, description: 'Furniture, boxes, delivery' },
  { key: 'laundry', icon: Shirt, description: 'Wash, fold, and iron' },
  { key: 'electrician', icon: Zap, description: 'Wiring, lighting, outlets' },
  { key: 'gardening', icon: TreePine, description: 'Mowing, weeding, planting' },
];

/* ──────────────────────────────────────────────────────────
   Intake question types & per-category questions  (REQ-TASK-00)
   ────────────────────────────────────────────────────────── */

type QuestionType = 'single_select' | 'multi_select' | 'dropdown' | 'yes_no' | 'numeric_counter';

interface IntakeQuestion {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[]; // for single_select / multi_select / dropdown
  min?: number; // for numeric_counter
  max?: number; // for numeric_counter
  unit?: string; // displayed after counter value
}

const CATEGORY_QUESTIONS: Record<string, IntakeQuestion[]> = {
  cleaning: [
    {
      id: 'cleaning_type',
      label: 'Type of cleaning',
      type: 'single_select',
      options: ['Regular', 'Deep', 'Move-out'],
    },
    {
      id: 'room_count',
      label: 'Number of rooms',
      type: 'dropdown',
      options: ['1', '2', '3', '4', '5+'],
    },
    {
      id: 'has_pets',
      label: 'Are there pets at home?',
      type: 'yes_no',
    },
    {
      id: 'supplies_provided',
      label: 'Will you provide cleaning supplies?',
      type: 'yes_no',
    },
  ],
  handyman: [
    {
      id: 'job_type',
      label: 'Type of work',
      type: 'multi_select',
      options: ['Plumbing', 'Furniture assembly', 'Shelving', 'Painting', 'Door/Lock repair'],
    },
    {
      id: 'item_count',
      label: 'Number of items / areas',
      type: 'numeric_counter',
      min: 1,
      max: 20,
    },
    {
      id: 'tools_provided',
      label: 'Will you provide tools?',
      type: 'yes_no',
    },
  ],
  moving: [
    {
      id: 'move_size',
      label: 'Move size',
      type: 'single_select',
      options: ['Few items', 'Studio / 1-room', '2-3 rooms', 'Full house'],
    },
    {
      id: 'floor_level',
      label: 'Floor level',
      type: 'dropdown',
      options: ['Ground floor', '2nd floor', '3rd floor', '4th floor', '5th+ floor'],
    },
    {
      id: 'has_elevator',
      label: 'Is there an elevator?',
      type: 'yes_no',
    },
    {
      id: 'helpers_needed',
      label: 'Helpers needed',
      type: 'numeric_counter',
      min: 1,
      max: 10,
      unit: 'people',
    },
  ],
  laundry: [
    {
      id: 'service_type',
      label: 'Service type',
      type: 'multi_select',
      options: ['Wash', 'Fold', 'Iron', 'Dry-clean'],
    },
    {
      id: 'load_count',
      label: 'Estimated loads',
      type: 'numeric_counter',
      min: 1,
      max: 10,
      unit: 'loads',
    },
    {
      id: 'pickup_needed',
      label: 'Need pickup & delivery?',
      type: 'yes_no',
    },
  ],
  electrician: [
    {
      id: 'work_type',
      label: 'Type of work',
      type: 'single_select',
      options: ['New wiring', 'Lighting', 'Outlet install', 'Fault diagnosis', 'Other'],
    },
    {
      id: 'point_count',
      label: 'Number of points / fixtures',
      type: 'numeric_counter',
      min: 1,
      max: 30,
    },
    {
      id: 'urgent',
      label: 'Is this urgent?',
      type: 'yes_no',
    },
  ],
  gardening: [
    {
      id: 'garden_services',
      label: 'Services needed',
      type: 'multi_select',
      options: ['Mowing', 'Weeding', 'Planting', 'Tree trimming', 'General cleanup'],
    },
    {
      id: 'area_size',
      label: 'Garden size',
      type: 'dropdown',
      options: [
        'Small (< 50 m²)',
        'Medium (50-150 m²)',
        'Large (150-500 m²)',
        'Very large (500+ m²)',
      ],
    },
    {
      id: 'recurring',
      label: 'Would you like recurring service?',
      type: 'yes_no',
    },
  ],
};

/* ──────────────────────────────────────────────────────────
   Typed state helpers
   ────────────────────────────────────────────────────────── */

type IntakeAnswers = Record<string, string | string[] | boolean | number>;

/* ──────────────────────────────────────────────────────────
   Sub-components: CategoryCard  (Step 1)
   ────────────────────────────────────────────────────────── */

interface CategoryCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

function CategoryCard({ icon: Icon, label, description, isSelected, onPress }: CategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
    >
      <View style={styles.categoryIconWrap}>
        <View style={styles.categoryIcon}>
          <Icon size={18} color={colors.primaryDeep} />
        </View>
      </View>
      <Text style={styles.categoryLabel}>{label}</Text>
      <Text style={styles.categoryDesc}>{description}</Text>
    </Pressable>
  );
}

/* ──────────────────────────────────────────────────────────
   Sub-components: field renderers  (Step 2)
   ────────────────────────────────────────────────────────── */

function SingleSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => toggle(opt)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            {selected && (
              <Check size={12} color={colors.primaryForeground} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Dropdown({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.dropdownContainer}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.dropdownRow, selected && styles.dropdownRowSelected]}
          >
            <Text style={[styles.dropdownText, selected && styles.dropdownTextSelected]}>
              {opt}
            </Text>
            {selected && <Check size={16} color={colors.primaryDeep} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function YesNoToggle({
  value,
  onChange,
  t,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.yesNoRow}>
      <Text style={styles.yesNoLabel}>{value ? t('common.yes') : t('common.no')}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor={colors.card}
      />
    </View>
  );
}

function NumericCounter({
  value,
  onChange,
  min = 0,
  max = 99,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <View style={styles.counterRow}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.counterButton, value <= min && styles.counterButtonDisabled]}
        disabled={value <= min}
      >
        <Minus size={16} color={value <= min ? colors.mutedForeground : colors.primaryDeep} />
      </Pressable>
      <View style={styles.counterValueWrap}>
        <Text style={styles.counterValue}>{value}</Text>
        {unit ? <Text style={styles.counterUnit}>{unit}</Text> : null}
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.counterButton, value >= max && styles.counterButtonDisabled]}
        disabled={value >= max}
      >
        <Plus size={16} color={value >= max ? colors.mutedForeground : colors.primaryDeep} />
      </Pressable>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────
   Scope summary builder  (Step 4)
   ────────────────────────────────────────────────────────── */

function buildScopeSummary(
  category: string,
  answers: IntakeAnswers,
  questions: IntakeQuestion[],
): string {
  const parts: string[] = [];
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  parts.push(`${categoryLabel} task`);

  for (const q of questions) {
    const val = answers[q.id];
    if (val === undefined || val === null) continue;

    if (q.type === 'yes_no') {
      if (val === true) {
        parts.push(
          q.label
            .replace(/\?$/, '')
            .replace(/^(Will you |Are there |Is there |Is this |Would you like |Need )/, '')
            .trim() + ': Yes',
        );
      }
    } else if (q.type === 'multi_select' && Array.isArray(val) && val.length > 0) {
      parts.push(`${q.label}: ${val.join(', ')}`);
    } else if (q.type === 'numeric_counter' && typeof val === 'number') {
      const unitLabel = q.unit ? ` ${q.unit}` : '';
      parts.push(`${q.label}: ${val}${unitLabel}`);
    } else if (typeof val === 'string' && val) {
      parts.push(`${q.label}: ${val}`);
    }
  }

  return parts.join('\n• ');
}

/* ──────────────────────────────────────────────────────────
   Main Wizard Component
   ────────────────────────────────────────────────────────── */

export function TaskPostWizard() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createTask = useCreateTask();
  const { data: categoriesData } = useCategories();

  const totalSteps = 4;

  // ── State ───────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [intakeAnswers, setIntakeAnswers] = useState<IntakeAnswers>({});

  // Step 3
  const [location, setLocation] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [budget, setBudget] = useState('');
  const [photoCount, setPhotoCount] = useState(0);

  // Step 4
  const [scopeSummary, setScopeSummary] = useState('');
  const [scopeEdited, setScopeEdited] = useState(false);

  // ── Derived ─────────────────────────
  const questions = selectedCategory ? (CATEGORY_QUESTIONS[selectedCategory] ?? []) : [];

  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 1:
        return selectedCategory !== null;
      case 2:
        // require at least one answer
        return Object.keys(intakeAnswers).length > 0;
      case 3:
        return location.trim().length > 0 && budget.trim().length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedCategory, intakeAnswers, location, budget]);

  // ── Answer helpers ──────────────────
  const setAnswer = useCallback((id: string, val: string | string[] | boolean | number) => {
    setIntakeAnswers((prev) => ({ ...prev, [id]: val }));
  }, []);

  // ── Navigation ──────────────────────
  const goNext = useCallback(() => {
    if (currentStep === 2 && !scopeEdited) {
      const qs = selectedCategory ? (CATEGORY_QUESTIONS[selectedCategory] ?? []) : [];
      const summary = buildScopeSummary(selectedCategory!, intakeAnswers, qs);
      setScopeSummary(summary);
    }
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, selectedCategory, intakeAnswers, scopeEdited]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else {
      router.back();
    }
  }, [currentStep, router]);

  const handlePost = useCallback(async () => {
    try {
      const cats = categoriesData?.data ?? [];
      const categoryObj = cats.find(
        (c: { name: string }) => c.name.toLowerCase() === selectedCategory,
      );
      await createTask.mutateAsync({
        category_id: categoryObj?.id ?? '',
        description: scopeSummary,
        budget: parseInt(budget, 10) || 0,
        location_lat: 0,
        location_lng: 0,
        location_text: location,
        scheduled_at:
          scheduleDate && scheduleTime
            ? `${scheduleDate}T${scheduleTime}:00`
            : new Date().toISOString(),
        photo_keys: [],
      });
      router.back();
    } catch {
      // error handled by Toast
    }
  }, [
    router,
    categoriesData,
    selectedCategory,
    scopeSummary,
    budget,
    location,
    scheduleDate,
    scheduleTime,
    createTask,
  ]);

  /* ────────────────────────────────────
       Step 1: Category Selection
       ──────────────────────────────────── */
  const renderStep1 = () => (
    <>
      {/* Headline */}
      <View style={styles.headline}>
        <Text style={styles.headlineTitle}>
          {t('taskPost.headline', 'What do you need help with?')}
        </Text>
        <Text style={styles.headlineSubtitle}>
          {t(
            'taskPost.subtitle',
            'Select a category to find the best local professionals for your task.',
          )}
        </Text>
      </View>

      {/* Category Grid */}
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.key}
            icon={cat.icon}
            label={t(`categories.${cat.key}`, cat.key.charAt(0).toUpperCase() + cat.key.slice(1))}
            description={t(`categories.${cat.key}Desc`, cat.description)}
            isSelected={selectedCategory === cat.key}
            onPress={() => setSelectedCategory(cat.key)}
          />
        ))}
      </View>

      {/* Trust Shield */}
      <TrustBanner
        variant="compact"
        title={t('taskPost.verifiedPros', 'Verified Professionals')}
        description={t(
          'taskPost.trustDesc',
          'All service providers are background checked for your safety.',
        )}
      />
    </>
  );

  /* ────────────────────────────────────
       Step 2: Intake Form
       ──────────────────────────────────── */
  const renderStep2 = () => (
    <>
      <View style={styles.headline}>
        <Text style={styles.headlineTitle}>{t('taskPost.intakeTitle', 'Tell us more')}</Text>
        <Text style={styles.headlineSubtitle}>
          {t(
            'taskPost.intakeSubtitle',
            'Answer a few questions so we can match you with the right professional.',
          )}
        </Text>
      </View>

      <View style={styles.intakeList}>
        {questions.map((q) => (
          <View key={q.id} style={styles.intakeField}>
            <Text style={styles.fieldLabel}>{t(`intake.${q.id}`, q.label)}</Text>

            {q.type === 'single_select' && q.options && (
              <SingleSelect
                options={q.options}
                value={intakeAnswers[q.id] as string | undefined}
                onChange={(v) => setAnswer(q.id, v)}
              />
            )}

            {q.type === 'multi_select' && q.options && (
              <MultiSelect
                options={q.options}
                value={(intakeAnswers[q.id] as string[]) ?? []}
                onChange={(v) => setAnswer(q.id, v)}
              />
            )}

            {q.type === 'dropdown' && q.options && (
              <Dropdown
                options={q.options}
                value={intakeAnswers[q.id] as string | undefined}
                onChange={(v) => setAnswer(q.id, v)}
              />
            )}

            {q.type === 'yes_no' && (
              <YesNoToggle
                value={(intakeAnswers[q.id] as boolean) ?? false}
                onChange={(v) => setAnswer(q.id, v)}
                t={t}
              />
            )}

            {q.type === 'numeric_counter' && (
              <NumericCounter
                value={(intakeAnswers[q.id] as number) ?? q.min ?? 1}
                onChange={(v) => setAnswer(q.id, v)}
                min={q.min}
                max={q.max}
                unit={q.unit}
              />
            )}
          </View>
        ))}
      </View>
    </>
  );

  /* ────────────────────────────────────
       Step 3: Location, Schedule, Budget, Photos
       ──────────────────────────────────── */
  const renderStep3 = () => (
    <>
      <View style={styles.headline}>
        <Text style={styles.headlineTitle}>
          {t('taskPost.detailsTitle', 'Where, when & budget')}
        </Text>
        <Text style={styles.headlineSubtitle}>
          {t('taskPost.detailsSubtitle', 'Provide the practical details for your task.')}
        </Text>
      </View>

      {/* Location */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MapPin size={18} color={colors.primaryDeep} />
          <Text style={styles.sectionLabel}>{t('taskPost.location', 'Location')}</Text>
        </View>
        <TextInput
          style={styles.textInput}
          placeholder={t('taskPost.locationPlaceholder', 'Enter address or area')}
          placeholderTextColor={colors.mutedForeground}
          value={location}
          onChangeText={setLocation}
        />
        <Pressable style={styles.pinDropPlaceholder}>
          <MapPin size={14} color={colors.primaryDeep} />
          <Text style={styles.pinDropText}>{t('taskPost.pinDrop', 'Drop pin on map')}</Text>
        </Pressable>
      </View>

      {/* Schedule */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Calendar size={18} color={colors.primaryDeep} />
          <Text style={styles.sectionLabel}>{t('taskPost.schedule', 'Schedule')}</Text>
        </View>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleField}>
            <Text style={styles.miniLabel}>{t('taskPost.date', 'Date')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={scheduleDate}
              onChangeText={setScheduleDate}
            />
          </View>
          <View style={styles.scheduleField}>
            <Text style={styles.miniLabel}>{t('taskPost.time', 'Time')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="HH:MM"
              placeholderTextColor={colors.mutedForeground}
              value={scheduleTime}
              onChangeText={setScheduleTime}
            />
          </View>
        </View>
      </View>

      {/* Budget */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <DollarSign size={18} color={colors.primaryDeep} />
          <Text style={styles.sectionLabel}>{t('taskPost.budget', 'Budget')}</Text>
        </View>
        <View style={styles.budgetRow}>
          <TextInput
            style={[styles.textInput, styles.budgetInput]}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
          <View style={styles.budgetSuffix}>
            <Text style={styles.budgetSuffixText}>MNT</Text>
          </View>
        </View>
      </View>

      {/* Photos */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Camera size={18} color={colors.primaryDeep} />
          <Text style={styles.sectionLabel}>{t('taskPost.photos', 'Photos')}</Text>
        </View>
        <Pressable style={styles.addPhotosButton} onPress={() => setPhotoCount((c) => c + 1)}>
          <Camera size={20} color={colors.primaryDeep} />
          <Text style={styles.addPhotosText}>
            {t('taskPost.addPhotos', 'Add Photos')}
            {photoCount > 0 ? ` (${photoCount})` : ''}
          </Text>
        </Pressable>
      </View>
    </>
  );

  /* ────────────────────────────────────
       Step 4: Review & Post
       ──────────────────────────────────── */
  const renderStep4 = () => {
    const categoryLabel = selectedCategory
      ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
      : '';

    return (
      <>
        <View style={styles.headline}>
          <Text style={styles.headlineTitle}>{t('taskPost.reviewTitle', 'Review & Post')}</Text>
          <Text style={styles.headlineSubtitle}>
            {t('taskPost.reviewSubtitle', 'Review your task details before posting.')}
          </Text>
        </View>

        {/* Scope Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('taskPost.scopeSummary', 'Scope Summary')}</Text>
          <Text style={styles.scopeHint}>
            {t('taskPost.scopeHint', 'Auto-generated from your answers. You can edit below.')}
          </Text>
          <TextInput
            style={[styles.textInput, styles.scopeInput]}
            multiline
            value={scopeSummary}
            onChangeText={(text) => {
              setScopeSummary(text);
              setScopeEdited(true);
            }}
            placeholder={t('taskPost.scopePlaceholder', 'Describe the scope of your task...')}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Preview cards */}
        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>
            {t('taskPost.taskDetails', 'Task Details')}
          </Text>

          {/* Category */}
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{t('taskPost.categoryLabel', 'Category')}</Text>
            <Text style={styles.previewValue}>{categoryLabel}</Text>
          </View>

          {/* Location */}
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{t('taskPost.location', 'Location')}</Text>
            <Text style={styles.previewValue}>{location || t('taskPost.notSet', 'Not set')}</Text>
          </View>

          {/* Schedule */}
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{t('taskPost.schedule', 'Schedule')}</Text>
            <Text style={styles.previewValue}>
              {scheduleDate || scheduleTime
                ? [scheduleDate, scheduleTime].filter(Boolean).join(' at ')
                : t('taskPost.flexible', 'Flexible')}
            </Text>
          </View>

          {/* Budget */}
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>{t('taskPost.budget', 'Budget')}</Text>
            <Text style={styles.previewValue}>
              {budget ? `${budget} MNT` : t('taskPost.notSet', 'Not set')}
            </Text>
          </View>

          {/* Photos */}
          <View style={[styles.previewRow, styles.previewRowLast]}>
            <Text style={styles.previewLabel}>{t('taskPost.photos', 'Photos')}</Text>
            <Text style={styles.previewValue}>
              {photoCount > 0
                ? t('taskPost.photoCount', '{{count}} attached', { count: photoCount })
                : t('taskPost.none', 'None')}
            </Text>
          </View>
        </View>
      </>
    );
  };

  /* ────────────────────────────────────
       Render
       ──────────────────────────────────── */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={goBack} style={styles.closeButton}>
            {currentStep > 1 ? (
              <ChevronLeft size={18} color={colors.foreground} />
            ) : (
              <X size={14} color={colors.foreground} />
            )}
          </Pressable>
          <Text style={styles.headerTitle}>{t('taskPost.title', 'Post a New Task')}</Text>
          <Text style={styles.stepIndicator}>
            {t('taskPost.step', 'Step {{current}} of {{total}}', {
              current: currentStep,
              total: totalSteps,
            })}
          </Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` as any }]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.footerButtons}>
          {currentStep > 1 && (
            <Button
              label={t('taskPost.back', 'BACK')}
              variant="outline"
              onPress={goBack}
              style={styles.backButton}
              textStyle={styles.backButtonText}
            />
          )}
          {currentStep < totalSteps ? (
            <Button
              label={t('taskPost.next', 'NEXT')}
              variant={canAdvance ? 'default' : 'secondary'}
              disabled={!canAdvance}
              onPress={goNext}
              style={
                currentStep === 1
                  ? { ...styles.nextButton, ...styles.nextButtonFull }
                  : styles.nextButton
              }
              textStyle={styles.nextButtonText}
            />
          ) : (
            <Button
              label={t('taskPost.post', 'POST TASK')}
              variant="default"
              onPress={handlePost}
              isLoading={createTask.isPending}
              style={{ ...styles.nextButton, ...styles.postButton }}
              textStyle={styles.nextButtonText}
            />
          )}
        </View>
      </View>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────
   Styles
   ────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Header */
  header: {
    backgroundColor: colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  stepIndicator: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primaryDeep,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 128,
    gap: 28,
  },

  /* Headline */
  headline: {
    gap: 12,
    alignItems: 'center',
  },
  headlineTitle: {
    fontSize: typography.heroTitle,
    fontWeight: '800',
    color: colors.foreground,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.75,
  },
  headlineSubtitle: {
    fontSize: typography.subtitle,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 28,
  },

  /* Category Grid (Step 1) */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: colors.primary,
  },
  categoryIconWrap: {
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.subtleViolet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.foreground,
  },
  categoryDesc: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    lineHeight: 16,
    marginTop: 4,
  },

  /* Intake form (Step 2) */
  intakeList: {
    gap: 24,
  },
  intakeField: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.foreground,
  },

  /* Chips (single / multi select) */
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primaryDeep,
  },
  chipText: {
    fontSize: typography.label,
    fontWeight: '500',
    color: colors.foreground,
  },
  chipTextSelected: {
    color: colors.primaryForeground,
    fontWeight: '600',
  },

  /* Dropdown */
  dropdownContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownRowSelected: {
    backgroundColor: colors.muted,
  },
  dropdownText: {
    fontSize: typography.label,
    color: colors.foreground,
  },
  dropdownTextSelected: {
    fontWeight: '600',
    color: colors.primaryDeep,
  },

  /* Yes/No toggle */
  yesNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yesNoLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.foreground,
  },

  /* Numeric counter */
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.4,
  },
  counterValueWrap: {
    alignItems: 'center',
    minWidth: 60,
  },
  counterValue: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  counterUnit: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    marginTop: 2,
  },

  /* Section cards (Step 3) */
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.foreground,
  },

  /* Text input */
  textInput: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
    color: colors.foreground,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.body,
  },

  /* Pin drop placeholder */
  pinDropPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  pinDropText: {
    fontSize: typography.label,
    color: colors.primaryDeep,
    fontWeight: '600',
  },

  /* Schedule */
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleField: {
    flex: 1,
    gap: 6,
  },
  miniLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  /* Budget */
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  budgetInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  budgetSuffix: {
    height: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: colors.input,
    borderLeftWidth: 0,
  },
  budgetSuffixText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryDeep,
  },

  /* Photos */
  addPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryDeep,
    backgroundColor: colors.muted,
  },
  addPhotosText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryDeep,
  },

  /* Review (Step 4) */
  scopeHint: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    marginTop: -4,
  },
  scopeInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewSection: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  previewSectionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.foreground,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewRowLast: {
    borderBottomWidth: 0,
  },
  previewLabel: {
    fontSize: typography.label,
    color: colors.mutedForeground,
  },
  previewValue: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.foreground,
    maxWidth: '55%',
    textAlign: 'right',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    padding: 24,
    ...elevations.navBar,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    borderRadius: radius.sm,
    paddingVertical: 16,
    flex: 1,
  },
  backButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  nextButton: {
    borderRadius: radius.sm,
    paddingVertical: 16,
    flex: 2,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  postButton: {
    backgroundColor: colors.primaryDeep,
  },
});
