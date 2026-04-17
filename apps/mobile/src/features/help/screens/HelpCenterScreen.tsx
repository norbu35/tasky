import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronUp, Search } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '@/components/shells';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

const { colors, spacing, radius, typography } = mobileTheme;
const HELP_SURFACE = {
  searchBarHeight: 44,
  headerHeight: 56,
  faqIconSize: 20,
  searchIconSize: 18,
  loadingRows: 6,
  errorVisual: {
    canvas: 132,
    halo: 108,
    haloOpacity: 0.55,
    ring: 92,
    ringBorderWidth: 2,
    bubblePrimary: {
      width: 58,
      height: 40,
      radius: 18,
      left: 8,
      top: 18,
      tailSize: 10,
      tailLeft: 12,
      tailBottom: -5,
    },
    bubbleSecondary: {
      width: 44,
      height: 30,
      radius: 14,
      right: 10,
      bottom: 14,
      tailSize: 8,
      tailRight: 10,
      tailBottom: -4,
    },
    marker: {
      size: 28,
    },
  },
} as const;

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

function buildFaqSections(t: (key: string) => string): FaqSection[] {
  return [
    {
      id: 'general',
      title: t('infra.help.sectionGeneral'),
      items: [
        {
          id: 'general-what-is-tasky',
          question: t('infra.help.qWhatIsTasky'),
          answer: t('infra.help.aWhatIsTasky'),
        },
        {
          id: 'general-how-it-works',
          question: t('infra.help.qHowItWorks'),
          answer: t('infra.help.aHowItWorks'),
        },
      ],
    },
    {
      id: 'tasks',
      title: t('infra.help.sectionTasks'),
      items: [
        {
          id: 'tasks-post-task',
          question: t('infra.help.qPostTask'),
          answer: t('infra.help.aPostTask'),
        },
      ],
    },
    {
      id: 'bookings',
      title: t('infra.help.sectionBookings'),
      items: [
        {
          id: 'bookings-cancel',
          question: t('infra.help.qCancelBooking'),
          answer: t('infra.help.aCancelBooking'),
        },
      ],
    },
    {
      id: 'payments',
      title: t('infra.help.sectionPayments'),
      items: [
        {
          id: 'payments-how-paid',
          question: t('infra.help.qHowPaid'),
          answer: t('infra.help.aHowPaid'),
        },
      ],
    },
    {
      id: 'account',
      title: t('infra.help.sectionAccount'),
      items: [
        {
          id: 'account-update',
          question: t('infra.help.qUpdateAccount'),
          answer: t('infra.help.aUpdateAccount'),
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
    <View testID="SCR-INFRA-005" className="flex-1 px-lg pt-xl">
      <View
        className="min-h-[44px] flex-row items-center gap-sm px-md mb-md"
        style={{ borderRadius: radius.md, backgroundColor: colors.muted }}
      >
        <Search size={HELP_SURFACE.searchIconSize} color={colors.textSecondary} />
        <Text className="flex-1 text-body" style={{ color: colors.textSecondary }}>
          {searchPlaceholder}
        </Text>
      </View>
      <View className="gap-md">
        {Array.from({ length: HELP_SURFACE.loadingRows }).map((_, index) => (
          <View
            key={index}
            className="min-h-[44px] flex-row items-center justify-between px-md py-md"
            style={{ borderRadius: radius.md, backgroundColor: colors.muted }}
          >
            <View
              style={{
                width: '75%',
                height: 16,
                borderRadius: radius.xs,
                backgroundColor: colors.border,
              }}
            />
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: radius.full,
                backgroundColor: colors.border,
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function HelpErrorVisual() {
  return (
    <View
      className="items-center justify-center mb-lg"
      style={{ width: HELP_SURFACE.errorVisual.canvas, height: HELP_SURFACE.errorVisual.canvas }}
      accessibilityRole="image"
    >
      <View
        style={{
          position: 'absolute',
          width: HELP_SURFACE.errorVisual.halo,
          height: HELP_SURFACE.errorVisual.halo,
          borderRadius: radius.full,
          backgroundColor: colors.muted,
          opacity: HELP_SURFACE.errorVisual.haloOpacity,
        }}
      />
      <View
        style={{
          width: HELP_SURFACE.errorVisual.ring,
          height: HELP_SURFACE.errorVisual.ring,
          borderRadius: radius.full,
          borderWidth: HELP_SURFACE.errorVisual.ringBorderWidth,
          borderColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: HELP_SURFACE.errorVisual.bubblePrimary.width,
            height: HELP_SURFACE.errorVisual.bubblePrimary.height,
            borderRadius: HELP_SURFACE.errorVisual.bubblePrimary.radius,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            position: 'absolute',
            left: HELP_SURFACE.errorVisual.bubblePrimary.left,
            top: HELP_SURFACE.errorVisual.bubblePrimary.top,
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: HELP_SURFACE.errorVisual.bubblePrimary.tailLeft,
              bottom: HELP_SURFACE.errorVisual.bubblePrimary.tailBottom,
              width: HELP_SURFACE.errorVisual.bubblePrimary.tailSize,
              height: HELP_SURFACE.errorVisual.bubblePrimary.tailSize,
              backgroundColor: colors.card,
              borderLeftWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.border,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
        <View
          style={{
            width: HELP_SURFACE.errorVisual.bubbleSecondary.width,
            height: HELP_SURFACE.errorVisual.bubbleSecondary.height,
            borderRadius: HELP_SURFACE.errorVisual.bubbleSecondary.radius,
            backgroundColor: colors.primary,
            position: 'absolute',
            right: HELP_SURFACE.errorVisual.bubbleSecondary.right,
            bottom: HELP_SURFACE.errorVisual.bubbleSecondary.bottom,
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: HELP_SURFACE.errorVisual.bubbleSecondary.tailRight,
              bottom: HELP_SURFACE.errorVisual.bubbleSecondary.tailBottom,
              width: HELP_SURFACE.errorVisual.bubbleSecondary.tailSize,
              height: HELP_SURFACE.errorVisual.bubbleSecondary.tailSize,
              backgroundColor: colors.primary,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
        <View
          style={{
            width: HELP_SURFACE.errorVisual.marker.size,
            height: HELP_SURFACE.errorVisual.marker.size,
            borderRadius: radius.full,
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="text-caption font-sans-bold" style={{ color: colors.dangerForeground }}>
            ?
          </Text>
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
    <View className="flex-1 px-lg pt-xl items-center">
      <HelpErrorVisual />
      <Text
        className="text-title font-sans-bold text-center mb-sm"
        style={{ color: colors.foreground }}
      >
        {headline}
      </Text>
      <Text
        className="text-body text-center"
        style={{ color: colors.textSecondary, lineHeight: typography.body * 1.6 }}
      >
        {description}
      </Text>
      <Button
        label={retryLabel}
        onPress={onRetry}
        style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
      />
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
      <Touchable
        className="min-h-[44px] flex-row items-center justify-between p-lg mb-sm"
        style={{ backgroundColor: colors.muted, borderRadius: radius.md }}
        onPress={onToggle}
        testID={`faq-item-${item.id}`}
      >
        <Text className="flex-1 text-body mr-sm" style={{ color: colors.foreground }}>
          {item.question}
        </Text>
        <Icon size={HELP_SURFACE.faqIconSize} color={colors.textSecondary} />
      </Touchable>
      {isExpanded ? (
        <View
          className="p-lg mb-sm"
          style={{ backgroundColor: colors.muted, borderRadius: radius.md }}
          testID={`faq-answer-${item.id}`}
        >
          <Text
            className="text-body"
            style={{ color: colors.textSecondary, lineHeight: mobileSurfaces.paragraphLineHeight }}
          >
            {item.answer}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function HelpCenterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const paramsState = params['state'];
  const [state, setState] = useState<ScreenState>(() => resolveState(paramsState));
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setState(resolveState(paramsState));
  }, [paramsState]);

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

  const searchPlaceholder = t('infra.help.searchPlaceholder');

  return (
    <ScreenContainer testID="help-screen">
      <View
        className="flex-row items-center justify-between px-md"
        style={{ height: HELP_SURFACE.headerHeight }}
      >
        <Touchable
          onPress={() => router.back()}
          className="min-h-[44px] px-xs flex-row items-center gap-xs"
          hitSlop={spacing.sm}
          testID="help-screen-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
          <Text className="text-body font-sans-medium" style={{ color: colors.primary }}>
            {t('infra.help.backLabel')}
          </Text>
        </Touchable>
        <Text
          className="flex-1 text-subtitle font-sans-semibold text-center mx-sm"
          style={{ color: colors.primaryDeep }}
        >
          {t('infra.help.title')}
        </Text>
        <View
          style={{ width: spacing['3xl'], height: spacing['3xl'] }}
          className="justify-center items-center"
        />
      </View>

      {state === 'loading' ? (
        <HelpLoading searchPlaceholder={searchPlaceholder} />
      ) : state === 'error' ? (
        <HelpErrorState
          headline={t('infra.help.errorHeadline')}
          description={t('infra.help.errorDescription')}
          retryLabel={t('infra.help.errorRetry')}
          onRetry={handleRetry}
        />
      ) : (
        <View className="flex-1">
          <View
            className="min-h-[44px] flex-row items-center gap-sm px-md mx-lg mt-xl mb-md"
            style={{ borderRadius: radius.md, backgroundColor: colors.muted }}
          >
            <Search size={HELP_SURFACE.searchIconSize} color={colors.textSecondary} />
            <Input
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              className="flex-1 text-body py-sm"
              style={{ color: colors.foreground }}
              testID="help-search-input"
            />
          </View>
          <InsetScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
            showsVerticalScrollIndicator={false}
            extraBottomInset={spacing.lg}
          >
            {visibleSections.map((section) => (
              <View key={section.id} className="mb-xl">
                <Text
                  className="text-subtitle font-sans-semibold mb-md"
                  style={{ color: colors.primaryDeep }}
                >
                  {section.title}
                </Text>
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
          </InsetScrollView>
        </View>
      )}
    </ScreenContainer>
  );
}
