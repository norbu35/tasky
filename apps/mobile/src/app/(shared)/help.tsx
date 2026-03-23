import React, { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

const HEADER_HEIGHT = 56;

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

function useFaqData(t: (key: string, fallback: string) => string): FaqSection[] {
  return [
    {
      id: 'general',
      title: t('infra.help.sectionGeneral', 'General'),
      items: [
        {
          id: 'general-1',
          question: t('infra.help.q_whatIsTasky', 'What is Tasky?'),
          answer: t(
            'infra.help.a_whatIsTasky',
            'Tasky is a trusted service marketplace connecting customers with verified service providers in Mongolia.',
          ),
        },
        {
          id: 'general-2',
          question: t('infra.help.q_howItWorks', 'How does Tasky work?'),
          answer: t(
            'infra.help.a_howItWorks',
            'Post a task describing what you need, receive applications from verified Taskers, choose the best match, and get it done.',
          ),
        },
      ],
    },
    {
      id: 'tasks',
      title: t('infra.help.sectionTasks', 'About Tasks'),
      items: [
        {
          id: 'tasks-1',
          question: t('infra.help.q_postTask', 'How do I post a task?'),
          answer: t(
            'infra.help.a_postTask',
            'Tap the "Post Task" button, select a category, provide details about your task, set your budget, and submit.',
          ),
        },
      ],
    },
    {
      id: 'bookings',
      title: t('infra.help.sectionBookings', 'About Bookings'),
      items: [
        {
          id: 'bookings-1',
          question: t('infra.help.q_cancelBooking', 'Can I cancel a booking?'),
          answer: t(
            'infra.help.a_cancelBooking',
            'Yes, you can cancel a booking before it starts. Late cancellations may affect your account standing.',
          ),
        },
      ],
    },
  ];
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
      {isExpanded && (
        <View style={styles.faqAnswerContainer} testID={`faq-answer-${item.id}`}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const sections = useFaqData(t);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} testID="help-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerAction}
          hitSlop={spacing.sm}
          testID="help-screen-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('infra.help.title', 'Help & Support')}</Text>
        <View style={styles.headerAction} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  headerAction: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 44,
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.body,
    color: colors.foreground,
    marginRight: spacing.sm,
  },
  faqAnswerContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
    marginBottom: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
  },
});
