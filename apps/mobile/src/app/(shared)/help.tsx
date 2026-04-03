import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronUp, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type ScreenState = 'loaded' | 'loading' | 'error';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqSection {
  id: string;
  title: string;
  items: FaqItem[];
}

function resolveState(value: string | string[] | undefined): ScreenState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'loading' || state === 'error' ? state : 'loaded';
}

function buildFaqSections(t: (key: string, fallback: string) => string): FaqSection[] {
  return [
    {
      id: 'general',
      title: t('infra.help.sectionGeneral', 'Ерөнхий'),
      items: [
        {
          id: 'general-what-is-tasky',
          question: t('infra.help.qWhatIsTasky', 'Tasky гэж юу вэ?'),
          answer: t(
            'infra.help.aWhatIsTasky',
            'Tasky бол Монгол дахь хэрэглэгчдийг үйлчилгээ үзүүлэгчидтэй холбодог найдвартай үйлчилгээний зах зээл юм.',
          ),
        },
        {
          id: 'general-how-it-works',
          question: t('infra.help.qHowItWorks', 'Tasky хэрхэн ажилладаг вэ?'),
          answer: t(
            'infra.help.aHowItWorks',
            'Ажлаа нийтэлж, өргөдөл хүлээн авч, хамгийн тохирохыг сонгон, захиалга дуусах хүртэл хянаарай.',
          ),
        },
      ],
    },
    {
      id: 'tasks',
      title: t('infra.help.sectionTasks', 'Даалгаврын тухай'),
      items: [
        {
          id: 'tasks-post-task',
          question: t('infra.help.qPostTask', 'Ажлаа хэрхэн нийтлэх вэ?'),
          answer: t(
            'infra.help.aPostTask',
            'Ажил оруулах хэсгээс дэлгэрэнгүй мэдээллээ бөглөж, төсвөө сонгоод, бүгд зөв бол илгээнэ үү.',
          ),
        },
      ],
    },
    {
      id: 'bookings',
      title: t('infra.help.sectionBookings', 'Захиалгын тухай'),
      items: [
        {
          id: 'bookings-cancel',
          question: t('infra.help.qCancelBooking', 'Захиалгаа цуцалж болох уу?'),
          answer: t(
            'infra.help.aCancelBooking',
            'Тийм. Захиалга эхлэхээс өмнө цуцалж болно, харин оройтож цуцлах нь бүртгэлийн байдалд нөлөөлж магадгүй.',
          ),
        },
      ],
    },
    {
      id: 'payments',
      title: t('infra.help.sectionPayments', 'Төлбөрийн тухай'),
      items: [
        {
          id: 'payments-how-paid',
          question: t('infra.help.qHowPaid', 'Төлбөр хэрхэн ажиллах вэ?'),
          answer: t(
            'infra.help.aHowPaid',
            'Төлбөрийн дэмжлэгийг үе шаттай нэвтрүүлж байна. Боломжтой үед та захиалгын урсгалаас дэмжигдэх сонголтуудыг харна.',
          ),
        },
      ],
    },
    {
      id: 'account',
      title: t('infra.help.sectionAccount', 'Бүртгэлийн тухай'),
      items: [
        {
          id: 'account-update',
          question: t('infra.help.qUpdateAccount', 'Бүртгэлээ хэрхэн шинэчлэх вэ?'),
          answer: t(
            'infra.help.aUpdateAccount',
            'Профайл эсвэл Тохиргоо хэсгээс хувийн мэдээлэл, холбоо барих мэдээлэл, тохиргоогоо шинэчилнэ үү.',
          ),
        },
      ],
    },
  ];
}

function filterSections(sections: FaqSection[], query: string): FaqSection[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return sections;
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(normalized) ||
          item.answer.toLowerCase().includes(normalized),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

function HelpLoading({ searchPlaceholder }: { searchPlaceholder: string }) {
  return (
    <View style={styles.loadingContainer} testID="help-screen-loading">
      <View style={styles.stickySearchBar}>
        <Search size={18} color={colors.textSecondary} />
        <Text style={styles.searchPlaceholder}>{searchPlaceholder}</Text>
      </View>
      <View style={styles.loadingList}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.loadingRow}>
            <View style={styles.loadingRowTitle} />
            <View style={styles.loadingRowIcon} />
          </View>
        ))}
      </View>
    </View>
  );
}

function HelpErrorVisual() {
  return (
    <View style={styles.errorVisual} accessibilityRole="image">
      <View style={styles.errorVisualGlow} />
      <View style={styles.errorVisualRing}>
        <View style={styles.errorVisualBubbleLarge}>
          <View style={styles.errorVisualBubbleTail} />
        </View>
        <View style={styles.errorVisualBubbleSmall}>
          <View style={styles.errorVisualBubbleSmallTail} />
        </View>
        <View style={styles.errorVisualBadge}>
          <Text style={styles.errorVisualBadgeText}>?</Text>
        </View>
      </View>
    </View>
  );
}

function HelpErrorState({
  headline,
  description,
  retryLabel,
  onRetry,
}: {
  headline: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorState}>
      <HelpErrorVisual />
      <Text style={styles.errorHeadline}>{headline}</Text>
      <Text style={styles.errorDescription}>{description}</Text>
      <Button label={retryLabel} onPress={onRetry} style={styles.errorButton} />
    </View>
  );
}

function FaqItemRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: FaqItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <View>
      <Pressable style={styles.faqRow} onPress={onToggle} testID={`faq-item-${item.id}`}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Icon size={20} color={colors.textSecondary} />
      </Pressable>
      {isExpanded ? (
        <View style={styles.faqAnswerContainer} testID={`faq-answer-${item.id}`}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function HelpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [state, setState] = useState<ScreenState>(() => resolveState(params.state));
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setState(resolveState(params.state));
  }, [params.state]);

  const sections = useMemo(() => buildFaqSections(t), [t]);
  const visibleSections = useMemo(() => filterSections(sections, query), [sections, query]);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRetry = () => {
    setQuery('');
    setExpandedId(null);
    setState('loaded');
  };

  const searchPlaceholder = t('infra.help.searchPlaceholder', 'Асуулт хайх...');

  return (
    <SafeAreaView style={styles.safeArea} testID="help-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={spacing.sm}
          testID="help-screen-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
          <Text style={styles.backLabel}>{t('infra.help.backLabel', 'Буцах')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('infra.help.title', 'Тусламж')}</Text>
        <View style={styles.headerAction} />
      </View>

      {state === 'loading' ? (
        <HelpLoading searchPlaceholder={searchPlaceholder} />
      ) : state === 'error' ? (
        <HelpErrorState
          headline={t('infra.help.errorHeadline', 'Ачааллах боломжгүй')}
          description={t(
            'infra.help.errorDescription',
            'Тусламжийн мэдээллийг ачааллахад алдаа гарлаа. Дахин оролдоно уу',
          )}
          retryLabel={t('infra.help.errorRetry', 'Дахин оролдох')}
          onRetry={handleRetry}
        />
      ) : (
        <View style={styles.content}>
          <View style={styles.stickySearchBar}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              testID="help-search-input"
            />
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {visibleSections.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <FaqItemRow
                    key={item.id}
                    item={item}
                    isExpanded={expandedId === item.id}
                    onToggle={() => handleToggle(item.id)}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  content: {
    flex: 1,
  },
  headerAction: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.primary,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primaryDeep,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stickySearchBar: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: colors.foreground,
    paddingVertical: spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primaryDeep,
    marginBottom: spacing.md,
  },
  faqRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.body,
    color: colors.foreground,
    marginRight: spacing.sm,
  },
  faqAnswerContainer: {
    padding: spacing.lg,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  loadingList: {
    gap: spacing.md,
  },
  loadingRow: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingRowTitle: {
    width: '75%',
    height: 16,
    borderRadius: radius.xs,
    backgroundColor: colors.muted,
  },
  loadingRowIcon: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  errorState: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  errorVisual: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorVisualGlow: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    opacity: 0.55,
  },
  errorVisualRing: {
    width: 92,
    height: 92,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorVisualBubbleLarge: {
    width: 58,
    height: 40,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'absolute',
    left: 8,
    top: 18,
  },
  errorVisualBubbleTail: {
    position: 'absolute',
    left: 12,
    bottom: -5,
    width: 10,
    height: 10,
    backgroundColor: colors.card,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  errorVisualBubbleSmall: {
    width: 44,
    height: 30,
    borderRadius: 14,
    backgroundColor: colors.primary,
    position: 'absolute',
    right: 10,
    bottom: 14,
  },
  errorVisualBubbleSmallTail: {
    position: 'absolute',
    right: 10,
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  errorVisualBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorVisualBadgeText: {
    color: colors.dangerForeground,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  errorHeadline: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  errorButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
